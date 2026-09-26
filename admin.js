/* =========================================================
   Panel privado: citas, tareas, recordatorios y horario
   Todo lo protege Supabase: sin sesión de administrador,
   la base de datos no devuelve nada.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const $ = (id) => document.getElementById(id);

    /* Crea elementos sin usar innerHTML (los datos de la gente
       nunca se interpretan como código) */
    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        Object.entries(props).forEach(([key, value]) => {
            if (value === undefined || value === null || value === false) return;
            if (key === "class") node.className = value;
            else if (key === "text") node.textContent = value;
            else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
            else node.setAttribute(key, value === true ? "" : value);
        });
        children.flat().forEach((c) => {
            if (c === null || c === undefined || c === false) return;
            node.append(c instanceof Node ? c : document.createTextNode(c));
        });
        return node;
    }

    const views = ["viewLoading", "viewLogin", "viewReset", "viewDenied", "viewApp"];
    const show = (id) => views.forEach((v) => { $(v).hidden = v !== id; });

    let toastTimer;
    function toast(message, isError = false) {
        const t = $("toast");
        t.textContent = message;
        t.classList.toggle("error", isError);
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
    }

    const fmtDay = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
    const fmtTime = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    const dayKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const todayKey = () => dayKey(new Date());
    const dayLabel = (key) => cap(fmtDay.format(new Date(`${key}T12:00:00Z`)));


    /* =========================
       SESIÓN
    ========================== */

    let started = false;

    async function route() {
        const { data } = await sb.auth.getSession();
        if (!data.session) return show("viewLogin");
        if (!(await sbIsAdmin())) return show("viewDenied");
        show("viewApp");
        if (!started) {
            started = true;
            startApp();
        }
    }

    sb.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
            show("viewReset");
            return;
        }
        if (event === "SIGNED_OUT") {
            started = false;
            show("viewLogin");
        }
    });

    $("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = $("loginEmail").value.trim();
        const password = $("loginPass").value;
        const status = $("loginStatus");
        status.className = "form-status";

        if (!email || !password) {
            status.textContent = "Escribe tu email y tu contraseña.";
            status.classList.add("error");
            return;
        }

        $("loginBtn").disabled = true;
        status.textContent = "Entrando…";
        const { error } = await sb.auth.signInWithPassword({ email, password });
        $("loginBtn").disabled = false;

        if (error) {
            status.textContent = "Email o contraseña incorrectos.";
            status.classList.add("error");
            return;
        }
        status.textContent = "";
        $("loginPass").value = "";
        route();
    });

    $("forgotBtn").addEventListener("click", async () => {
        const email = $("loginEmail").value.trim();
        const status = $("loginStatus");
        if (!email) {
            status.textContent = "Escribe primero tu email arriba.";
            status.className = "form-status error";
            $("loginEmail").focus();
            return;
        }
        const redirectTo = location.href.split("#")[0];
        await sb.auth.resetPasswordForEmail(email, { redirectTo });
        status.textContent = "Si el email es correcto, te llegará un enlace para cambiar la contraseña.";
        status.className = "form-status";
    });

    $("resetForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = $("resetPass").value;
        const status = $("resetStatus");
        if (password.length < 8) {
            status.textContent = "Mínimo 8 caracteres.";
            status.className = "form-status error";
            return;
        }
        const { error } = await sb.auth.updateUser({ password });
        if (error) {
            status.textContent = "No se ha podido cambiar. Pide otro enlace.";
            status.className = "form-status error";
            return;
        }
        history.replaceState(null, "", location.pathname);
        route();
    });

    document.querySelectorAll("[data-logout]").forEach((b) =>
        b.addEventListener("click", () => sb.auth.signOut())
    );


    /* =========================
       PESTAÑAS
    ========================== */

    const tabs = [...document.querySelectorAll(".tab")];

    function openTab(tab) {
        tabs.forEach((t) => {
            const on = t === tab;
            t.classList.toggle("active", on);
            t.setAttribute("aria-selected", String(on));
            $(t.getAttribute("aria-controls")).hidden = !on;
        });
        try { localStorage.setItem("admin-tab", tab.id); } catch (e) { /* sin almacenamiento */ }
    }

    tabs.forEach((t) => t.addEventListener("click", () => openTab(t)));


    function startApp() {
        let saved = null;
        try { saved = localStorage.getItem("admin-tab"); } catch (e) { /* nada */ }
        if (saved && $(saved)) openTab($(saved));

        loadBookings();
        loadTasks();
        loadReminders();
        loadAvailability();
        loadBlocked();
    }


    /* =========================
       CITAS
    ========================== */

    let bookings = [];
    let bookingView = "upcoming";

    const STATUS = {
        pendiente: "Pendiente",
        confirmada: "Confirmada",
        completada: "Completada",
        cancelada: "Cancelada"
    };

    async function loadBookings() {
        const { data, error } = await sb
            .from("bookings")
            .select("*")
            .order("starts_at", { ascending: true });

        if (error) return toast("No se han podido cargar las citas.", true);
        bookings = data;
        renderStats();
        renderBookings();
    }

    $("refreshBookings").addEventListener("click", async () => {
        await loadBookings();
        toast("Citas actualizadas");
    });

    document.querySelectorAll(".chip[data-view]").forEach((chip) => {
        chip.addEventListener("click", () => {
            bookingView = chip.dataset.view;
            document.querySelectorAll(".chip[data-view]").forEach((c) => {
                c.classList.toggle("active", c === chip);
                c.setAttribute("aria-pressed", String(c === chip));
            });
            renderBookings();
        });
    });

    function renderStats() {
        const now = Date.now();
        const week = now + 7 * 864e5;
        const today = todayKey();
        const active = bookings.filter((b) => b.status !== "cancelada");
        const pending = active.filter((b) => b.status === "pendiente" && new Date(b.starts_at) > now).length;

        $("statPending").textContent = pending;
        $("statToday").textContent = active.filter((b) => dayKey(new Date(b.starts_at)) === today).length;
        $("statWeek").textContent = active.filter((b) => {
            const t = new Date(b.starts_at).getTime();
            return t > now && t < week;
        }).length;

        const badge = $("pendingBadge");
        badge.hidden = pending === 0;
        badge.textContent = pending;
    }

    function renderBookings() {
        const list = $("bookingList");
        const now = Date.now();
        list.innerHTML = "";

        let items = bookings.filter((b) => {
            const future = new Date(b.starts_at).getTime() > now - 30 * 60e3;
            switch (bookingView) {
                case "upcoming": return future && b.status !== "cancelada";
                case "pending": return b.status === "pendiente" && future;
                case "past": return !future && b.status !== "cancelada";
                case "cancelled": return b.status === "cancelada";
                default: return true;
            }
        });

        if (bookingView === "past" || bookingView === "all") items = items.reverse();

        if (!items.length) {
            list.append(el("div", { class: "empty" },
                el("p", { text: bookingView === "upcoming" ? "No tienes citas próximas. Cuando alguien reserve, aparecerá aquí." : "No hay citas en esta vista." })
            ));
            return;
        }

        let lastDay = null;
        items.forEach((b) => {
            const key = dayKey(new Date(b.starts_at));
            if (key !== lastDay) {
                lastDay = key;
                list.append(el("h2", { class: "day-title", text: key === todayKey() ? `Hoy · ${dayLabel(key)}` : dayLabel(key) }));
            }
            list.append(bookingCard(b));
        });
    }

    function bookingCard(b) {
        const when = new Date(b.starts_at);
        const phoneDigits = (b.phone || "").replace(/[^\d+]/g, "");
        const waNumber = phoneDigits.replace(/^\+/, "").replace(/^(?=[6-9]\d{8}$)/, "34");
        const subject = encodeURIComponent("Tu cita con Mario Iglesias");
        const body = encodeURIComponent(
            `Hola ${b.name}:\n\nTe confirmo nuestra cita el ${fmtDay.format(when)} a las ${fmtTime.format(when)} (hora de Canarias).\n\n¡Hasta pronto!\nMario`
        );

        const setStatus = async (status) => {
            const { error } = await sb.from("bookings").update({ status }).eq("id", b.id);
            if (error) return toast("No se ha podido guardar.", true);
            b.status = status;
            renderStats();
            renderBookings();
            toast(`Cita marcada como ${STATUS[status].toLowerCase()}`);
        };

        const note = el("textarea", {
            class: "note",
            rows: "2",
            maxlength: "500",
            placeholder: "Notas privadas…",
            "aria-label": `Notas sobre la cita con ${b.name}`
        });
        note.value = b.admin_note || "";
        note.addEventListener("change", async () => {
            const { error } = await sb.from("bookings").update({ admin_note: note.value.trim() || null }).eq("id", b.id);
            if (error) return toast("No se ha podido guardar la nota.", true);
            b.admin_note = note.value.trim();
            toast("Nota guardada");
        });

        const actions = el("div", { class: "actions" });

        if (b.status === "pendiente") {
            actions.append(el("button", { class: "act primary", type: "button", onclick: () => setStatus("confirmada") }, "Confirmar"));
        }
        if (b.status === "confirmada" || b.status === "pendiente") {
            actions.append(el("button", { class: "act", type: "button", onclick: () => setStatus("completada") }, "Hecha"));
            actions.append(el("button", { class: "act", type: "button", onclick: () => {
                if (confirm(`¿Cancelar la cita con ${b.name}? La hora volverá a quedar libre.`)) setStatus("cancelada");
            } }, "Cancelar"));
        }
        if (b.status === "cancelada" || b.status === "completada") {
            actions.append(el("button", { class: "act", type: "button", onclick: () => setStatus("pendiente") }, "Reabrir"));
        }
        actions.append(el("button", { class: "act danger", type: "button", onclick: async () => {
            if (!confirm(`¿Borrar para siempre la cita con ${b.name}? No se puede deshacer.`)) return;
            const { error } = await sb.from("bookings").delete().eq("id", b.id);
            if (error) return toast("No se ha podido borrar.", true);
            bookings = bookings.filter((x) => x.id !== b.id);
            renderStats();
            renderBookings();
            toast("Cita borrada");
        } }, "Borrar"));

        return el("article", { class: `bcard status-${b.status}` },
            el("div", { class: "bcard-time" },
                el("strong", { text: fmtTime.format(when) }),
                el("span", { class: `pill pill-${b.status}`, text: STATUS[b.status] })
            ),
            el("div", { class: "bcard-body" },
                el("h3", { text: b.name }),
                el("div", { class: "contact-links" },
                    el("a", { href: `mailto:${b.email}?subject=${subject}&body=${body}` }, b.email),
                    b.phone ? el("a", { href: `tel:${phoneDigits}` }, b.phone) : null,
                    b.phone && waNumber.length >= 9 ? el("a", { href: `https://wa.me/${waNumber}`, target: "_blank", rel: "noopener noreferrer" }, "WhatsApp ↗") : null
                ),
                b.topic ? el("p", { class: "topic", text: b.topic }) : null,
                note,
                actions,
                el("p", { class: "created", text: `Reservada el ${new Date(b.created_at).toLocaleString("es-ES", { timeZone: TZ, dateStyle: "short", timeStyle: "short" })}` })
            )
        );
    }


    /* =========================
       TAREAS
    ========================== */

    let tasks = [];

    async function loadTasks() {
        const { data, error } = await sb.from("tasks").select("*").order("created_at", { ascending: true });
        if (error) return toast("No se han podido cargar las tareas.", true);
        tasks = data;
        renderTasks();
    }

    function renderTasks() {
        const list = $("taskList");
        list.innerHTML = "";
        const pending = tasks.filter((t) => !t.done).length;
        $("taskCount").textContent = tasks.length ? `${pending} pendiente${pending === 1 ? "" : "s"} de ${tasks.length}` : "";

        if (!tasks.length) {
            list.append(el("li", { class: "empty" }, "No tienes tareas. ¡Añade la primera!"));
            return;
        }

        [...tasks].sort((a, b) => a.done - b.done).forEach((t) => {
            const check = el("input", { type: "checkbox", "aria-label": `Completar: ${t.text}` });
            check.checked = t.done;
            check.addEventListener("change", async () => {
                const { error } = await sb.from("tasks").update({ done: check.checked }).eq("id", t.id);
                if (error) {
                    check.checked = !check.checked;
                    return toast("No se ha podido guardar.", true);
                }
                t.done = check.checked;
                renderTasks();
            });

            list.append(el("li", { class: t.done ? "done" : "" },
                el("label", {}, check, el("span", { text: t.text })),
                el("button", { class: "del", type: "button", "aria-label": `Borrar: ${t.text}`, onclick: async () => {
                    const { error } = await sb.from("tasks").delete().eq("id", t.id);
                    if (error) return toast("No se ha podido borrar.", true);
                    tasks = tasks.filter((x) => x.id !== t.id);
                    renderTasks();
                } }, "×")
            ));
        });
    }

    $("taskForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = $("taskInput");
        const text = input.value.trim();
        if (!text) return;
        const { data, error } = await sb.from("tasks").insert({ text }).select().single();
        if (error) return toast("No se ha podido añadir.", true);
        tasks.push(data);
        input.value = "";
        renderTasks();
    });


    /* =========================
       RECORDATORIOS
    ========================== */

    let reminders = [];

    async function loadReminders() {
        $("reminderDate").value = todayKey();
        const { data, error } = await sb.from("reminders").select("*").order("day").order("created_at");
        if (error) return toast("No se han podido cargar los recordatorios.", true);
        reminders = data;
        renderReminders();
    }

    $("showPastReminders").addEventListener("change", renderReminders);

    function renderReminders() {
        const list = $("reminderList");
        const showPast = $("showPastReminders").checked;
        const today = todayKey();
        list.innerHTML = "";

        const items = reminders.filter((r) => showPast || r.day >= today);
        if (!items.length) {
            list.append(el("p", { class: "empty" }, "No tienes recordatorios próximos."));
            return;
        }

        let lastDay = null;
        let ul;
        items.forEach((r) => {
            if (r.day !== lastDay) {
                lastDay = r.day;
                list.append(el("h2", { class: "day-title" + (r.day < today ? " past" : ""), text: r.day === today ? `Hoy · ${dayLabel(r.day)}` : dayLabel(r.day) }));
                ul = el("ul", { class: "task-list" });
                list.append(ul);
            }
            ul.append(el("li", {},
                el("span", { class: "dot" }),
                el("span", { class: "grow", text: r.text }),
                el("button", { class: "del", type: "button", "aria-label": `Borrar: ${r.text}`, onclick: async () => {
                    const { error } = await sb.from("reminders").delete().eq("id", r.id);
                    if (error) return toast("No se ha podido borrar.", true);
                    reminders = reminders.filter((x) => x.id !== r.id);
                    renderReminders();
                } }, "×")
            ));
        });
    }

    $("reminderForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const day = $("reminderDate").value;
        const text = $("reminderText").value.trim();
        if (!day || !text) return;
        const { data, error } = await sb.from("reminders").insert({ day, text }).select().single();
        if (error) return toast("No se ha podido añadir.", true);
        reminders.push(data);
        reminders.sort((a, b) => a.day.localeCompare(b.day));
        $("reminderText").value = "";
        renderReminders();
        toast("Recordatorio guardado");
    });


    /* =========================
       HORARIO
    ========================== */

    const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    let availability = [];

    async function loadAvailability() {
        const { data, error } = await sb.from("availability").select("*").order("weekday").order("start_time");
        if (error) return toast("No se ha podido cargar el horario.", true);
        availability = data;
        renderAvailability();
    }

    const hhmm = (t) => t.slice(0, 5);

    function renderAvailability() {
        const box = $("availabilityList");
        box.innerHTML = "";

        WEEKDAYS.forEach((name, i) => {
            const weekday = i + 1;
            const ranges = availability.filter((a) => a.weekday === weekday);

            const rangeList = el("div", { class: "ranges" },
                ranges.length ? null : el("span", { class: "closed", text: "Sin citas" }),
                ranges.map((r) => el("span", { class: "range" },
                    `${hhmm(r.start_time)} – ${hhmm(r.end_time)}`,
                    el("button", { type: "button", "aria-label": `Quitar franja ${hhmm(r.start_time)} a ${hhmm(r.end_time)} del ${name}`, onclick: async () => {
                        const { error } = await sb.from("availability").delete().eq("id", r.id);
                        if (error) return toast("No se ha podido quitar.", true);
                        availability = availability.filter((x) => x.id !== r.id);
                        renderAvailability();
                        toast("Franja quitada");
                    } }, "×")
                ))
            );

            const start = el("input", { type: "time", step: "1800", value: "10:00", "aria-label": `Desde (${name})` });
            const end = el("input", { type: "time", step: "1800", value: "14:00", "aria-label": `Hasta (${name})` });

            const add = el("form", { class: "range-add", onsubmit: async (e) => {
                e.preventDefault();
                if (!start.value || !end.value || end.value <= start.value) {
                    return toast("La hora final tiene que ser después de la inicial.", true);
                }
                const { data, error } = await sb.from("availability")
                    .insert({ weekday, start_time: start.value, end_time: end.value })
                    .select().single();
                if (error) return toast("No se ha podido añadir.", true);
                availability.push(data);
                availability.sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
                renderAvailability();
                toast(`Franja añadida al ${name.toLowerCase()}`);
            } }, start, el("span", { text: "a" }), end, el("button", { class: "btn-small", type: "submit" }, "+ Añadir"));

            box.append(el("div", { class: "weekday" + (ranges.length ? "" : " off") },
                el("strong", { text: name }),
                rangeList,
                add
            ));
        });
    }

    let blocked = [];

    async function loadBlocked() {
        const { data, error } = await sb.from("blocked_days").select("*").order("day");
        if (error) return toast("No se han podido cargar los días bloqueados.", true);
        blocked = data;
        renderBlocked();
    }

    function renderBlocked() {
        const list = $("blockList");
        list.innerHTML = "";
        const upcoming = blocked.filter((b) => b.day >= todayKey());
        if (!upcoming.length) {
            list.append(el("li", { class: "empty" }, "No hay días bloqueados."));
            return;
        }
        upcoming.forEach((b) => {
            list.append(el("li", {},
                el("strong", { text: dayLabel(b.day) }),
                el("span", { class: "grow muted", text: b.reason || "" }),
                el("button", { class: "del", type: "button", "aria-label": `Desbloquear ${dayLabel(b.day)}`, onclick: async () => {
                    const { error } = await sb.from("blocked_days").delete().eq("day", b.day);
                    if (error) return toast("No se ha podido desbloquear.", true);
                    blocked = blocked.filter((x) => x.day !== b.day);
                    renderBlocked();
                } }, "×")
            ));
        });
    }

    $("blockForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const day = $("blockDate").value;
        const reason = $("blockReason").value.trim() || null;
        if (!day) return;
        const { error } = await sb.from("blocked_days").upsert({ day, reason });
        if (error) return toast("No se ha podido bloquear.", true);
        $("blockReason").value = "";
        await loadBlocked();
        toast("Día bloqueado");
    });


    route();
});
