/* =========================================================
   Agenda una cita: calendario desplegable + reserva
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("bookingForm");
    if (!form || !window.sb) return;

    const $ = (id) => document.getElementById(id);

    const picker = $("picker");
    const toggle = $("pickerToggle");
    const pickerValue = $("pickerValue");
    const calTitle = $("calTitle");
    const calGrid = $("calGrid");
    const calPrev = $("calPrev");
    const calNext = $("calNext");
    const slotsTitle = $("slotsTitle");
    const slotsBox = $("slots");
    const status = $("bStatus");
    const submit = $("bSubmit");

    const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const fmtTime = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    const fmtLong = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

    /* "Hoy" en Canarias, como texto AAAA-MM-DD */
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
    const [ty, tm] = todayKey.split("-").map(Number);

    const pad = (n) => String(n).padStart(2, "0");
    const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

    let viewYear = ty;
    let viewMonth = tm - 1;          // 0-11
    let availableDays = new Set();
    let selectedDay = null;          // "AAAA-MM-DD"
    let selectedSlot = null;         // ISO
    let loadToken = 0;

    // Se puede reservar hasta ~60 días vista → como mucho 2 meses por delante
    const maxMonthIndex = ty * 12 + (tm - 1) + 2;


    /* ---------- Abrir / cerrar el desplegable ---------- */

    const setOpen = (open) => {
        picker.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (open && !calGrid.children.length) loadMonth();
    };

    toggle.addEventListener("click", () => setOpen(!picker.classList.contains("open")));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && picker.classList.contains("open")) {
            setOpen(false);
            toggle.focus();
        }
    });


    /* ---------- Calendario ---------- */

    async function loadMonth() {
        const token = ++loadToken;
        const lastDay = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
        const from = keyOf(viewYear, viewMonth, 1) < todayKey ? todayKey : keyOf(viewYear, viewMonth, 1);
        const to = keyOf(viewYear, viewMonth, lastDay);

        calTitle.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
        calPrev.disabled = viewYear * 12 + viewMonth <= ty * 12 + (tm - 1);
        calNext.disabled = viewYear * 12 + viewMonth >= maxMonthIndex;
        calGrid.classList.add("loading");
        renderGrid();

        const { data, error } = await sb.rpc("get_available_days", { p_from: from, p_to: to });
        if (token !== loadToken) return;

        calGrid.classList.remove("loading");
        if (error) {
            slotsTitle.textContent = "No se ha podido cargar la agenda. Inténtalo de nuevo en un momento.";
            return;
        }

        availableDays = new Set(data);
        renderGrid();

        if (!availableDays.size) {
            slotsTitle.textContent = "Este mes ya no quedan huecos. Mira el mes siguiente.";
        } else if (!selectedDay) {
            slotsTitle.textContent = "Elige uno de los días marcados.";
        }
    }

    function renderGrid() {
        calGrid.innerHTML = "";
        const first = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay(); // 0 = domingo
        const offset = (first + 6) % 7;
        const lastDay = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

        for (let i = 0; i < offset; i++) {
            calGrid.appendChild(document.createElement("span"));
        }

        for (let d = 1; d <= lastDay; d++) {
            const key = keyOf(viewYear, viewMonth, d);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cal-day";
            btn.textContent = d;

            const free = availableDays.has(key);
            btn.disabled = !free;
            if (free) btn.classList.add("free");
            if (key === todayKey) btn.classList.add("today");
            if (key === selectedDay) {
                btn.classList.add("selected");
                btn.setAttribute("aria-pressed", "true");
            }

            const label = fmtLong.format(new Date(`${key}T12:00:00Z`));
            btn.setAttribute("aria-label", free ? `${label}, con huecos libres` : `${label}, sin huecos`);

            btn.addEventListener("click", () => selectDay(key));
            calGrid.appendChild(btn);
        }
    }

    calPrev.addEventListener("click", () => {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        loadMonth();
    });

    calNext.addEventListener("click", () => {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        loadMonth();
    });


    /* ---------- Horas ---------- */

    async function selectDay(key) {
        selectedDay = key;
        selectedSlot = null;
        updateValue();
        renderGrid();

        const label = fmtLong.format(new Date(`${key}T12:00:00Z`));
        slotsTitle.textContent = `Cargando horas del ${label}…`;
        slotsBox.innerHTML = "";

        const { data, error } = await sb.rpc("get_available_slots", { p_day: key });
        if (selectedDay !== key) return;

        if (error) {
            slotsTitle.textContent = "No se han podido cargar las horas.";
            return;
        }

        if (!data.length) {
            slotsTitle.textContent = "Ese día ya no quedan horas libres.";
            return;
        }

        slotsTitle.textContent = `Horas libres · ${label}`;

        data.forEach(({ starts_at }) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "slot";
            chip.textContent = fmtTime.format(new Date(starts_at));
            chip.setAttribute("aria-pressed", "false");
            chip.addEventListener("click", () => {
                selectedSlot = starts_at;
                slotsBox.querySelectorAll(".slot").forEach((c) => {
                    const on = c === chip;
                    c.classList.toggle("selected", on);
                    c.setAttribute("aria-pressed", String(on));
                });
                updateValue();
                picker.classList.remove("invalid");
                setTimeout(() => setOpen(false), 280);
            });
            slotsBox.appendChild(chip);
        });
    }

    function updateValue() {
        if (selectedSlot) {
            const date = new Date(selectedSlot);
            const day = fmtLong.format(date);
            pickerValue.textContent = `${day.charAt(0).toUpperCase() + day.slice(1)} · ${fmtTime.format(date)}`;
            picker.classList.add("has-value");
        } else {
            pickerValue.textContent = "Elige día y hora";
            picker.classList.remove("has-value");
        }
    }


    /* ---------- Validación y envío ---------- */

    const fields = {
        name: $("bName"),
        email: $("bEmail"),
        phone: $("bPhone"),
        topic: $("bTopic"),
        consent: $("bConsent")
    };

    const markInvalid = (el, bad) => {
        el.closest(".field, .consent").classList.toggle("invalid", bad);
        el.setAttribute("aria-invalid", String(bad));
    };

    [fields.name, fields.email].forEach((el) => {
        el.addEventListener("blur", () => markInvalid(el, !el.checkValidity()));
        el.addEventListener("input", () => {
            if (el.getAttribute("aria-invalid") === "true") markInvalid(el, !el.checkValidity());
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        status.textContent = "";
        status.className = "form-status";

        const nameOk = fields.name.value.trim().length >= 2;
        const emailOk = fields.email.checkValidity() && fields.email.value.trim() !== "";
        markInvalid(fields.name, !nameOk);
        markInvalid(fields.email, !emailOk);
        markInvalid(fields.consent, !fields.consent.checked);
        picker.classList.toggle("invalid", !selectedSlot);

        if (!nameOk) return fail("Escribe tu nombre.", fields.name);
        if (!emailOk) return fail("Revisa tu email.", fields.email);
        if (!selectedSlot) {
            setOpen(true);
            return fail("Elige un día y una hora.", toggle);
        }
        if (!fields.consent.checked) return fail("Marca la casilla para poder guardar tus datos.", fields.consent);

        submit.disabled = true;
        submit.textContent = "Reservando…";

        const { error } = await sb.rpc("book_appointment", {
            p_name: fields.name.value.trim(),
            p_email: fields.email.value.trim(),
            p_phone: fields.phone.value.trim(),
            p_topic: fields.topic.value.trim(),
            p_starts_at: selectedSlot
        });

        submit.disabled = false;
        submit.textContent = "Reservar cita";

        if (error) {
            const msg = error.message || "";
            if (msg.includes("slot_unavailable")) {
                fail("Vaya, esa hora se acaba de ocupar. Elige otra, por favor.");
                const day = selectedDay;
                selectedSlot = null;
                updateValue();
                setOpen(true);
                await loadMonth();
                if (availableDays.has(day)) selectDay(day);
            } else if (msg.includes("too_many")) {
                fail("Ya tienes varias citas pendientes con este email. Te escribiré pronto.");
            } else {
                fail("No se ha podido reservar. Inténtalo de nuevo en un momento.");
            }
            return;
        }

        const when = new Date(selectedSlot);
        const day = fmtLong.format(when);
        $("doneText").textContent =
            `Nos vemos el ${day} a las ${fmtTime.format(when)} (hora de Canarias). ` +
            `Te escribiré a ${fields.email.value.trim()} para confirmarla.`;

        form.hidden = true;
        $("bookingDone").hidden = false;
        $("bookingDone").querySelector("h3").focus?.();
    });

    function fail(message, focusEl) {
        status.textContent = message;
        status.className = "form-status error";
        if (focusEl) focusEl.focus();
    }

    $("bookAnother").addEventListener("click", () => {
        form.reset();
        selectedDay = null;
        selectedSlot = null;
        updateValue();
        calGrid.innerHTML = "";
        slotsBox.innerHTML = "";
        slotsTitle.textContent = "Elige uno de los días marcados.";
        $("bookingDone").hidden = true;
        form.hidden = false;
        fields.name.focus();
    });
});
