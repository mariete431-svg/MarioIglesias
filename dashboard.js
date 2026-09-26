document.addEventListener("DOMContentLoaded", () => {

    /* =================================
       CALENDAR
    ================================= */

    const calendarGrid =
        document.getElementById("calendarGrid");

    const calendarMonth =
        document.getElementById("calendarMonth");

    const selectedDate =
        document.getElementById("selectedDate");

    const previousMonth =
        document.getElementById("previousMonth");

    const nextMonth =
        document.getElementById("nextMonth");

    const todayButton =
        document.getElementById("todayButton");


    const now = new Date();

    let displayedDate =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );


    let selected =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
    ];


    /* ---------------------------------
       Colores y notas por día (nuevo)
       Guardado en localStorage, por navegador.
    --------------------------------- */

    const CAL_STORAGE_KEY = "mario-calendario-dias";

    const DAY_COLORS = [
        { id: "yellow", label: "Importante", hex: "#f4e99b" },
        { id: "forest", label: "Trabajo", hex: "#10291f" },
        { id: "blue", label: "Personal", hex: "#7ea3c9" },
        { id: "rose", label: "Recordatorio", hex: "#d99a9a" }
    ];

    function loadDayData() {
        try {
            const raw = localStorage.getItem(CAL_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            return {};
        }
    }

    function saveDayData(data) {
        // Con sesión de administrador se guarda en Supabase, no aquí
        if (cloud) return;
        localStorage.setItem(CAL_STORAGE_KEY, JSON.stringify(data));
    }

    let dayData = loadDayData();


    /* ---------------------------------
       Nube (Supabase): si has entrado en el panel privado
       (admin.html), colores y recordatorios se guardan en tu
       base de datos y los ves desde cualquier dispositivo.
    --------------------------------- */

    let cloud = false;

    async function initCloud() {

        if (!window.sbIsAdmin || !(await window.sbIsAdmin())) return;

        const [days, rems] = await Promise.all([
            sb.from("calendar_days").select("day, color"),
            sb.from("reminders").select("id, day, text").order("created_at")
        ]);

        if (days.error || rems.error) return;

        const local = dayData;
        const next = {};

        days.data.forEach((d) => {
            next[d.day] = { color: d.color, events: [] };
        });

        rems.data.forEach((r) => {
            if (!next[r.day]) next[r.day] = { color: null, events: [] };
            next[r.day].events.push({ id: r.id, text: r.text });
        });

        cloud = true;
        dayData = next;

        const badge = document.createElement("span");
        badge.textContent = "☁ Guardado en tu cuenta";
        badge.style.cssText = "display:inline-block;margin-left:10px;padding:2px 10px;border-radius:999px;background:#f4e99b;color:#10291f;font-size:12px;font-weight:600;vertical-align:middle;";
        selectedDate.after(badge);

        // Si lo tenías guardado solo en este navegador, ofrece subirlo
        const hasLocal = Object.values(local).some((d) => d.color || (d.events && d.events.length));

        if (hasLocal && !days.data.length && !rems.data.length &&
            confirm("Tienes recordatorios guardados solo en este navegador. ¿Quieres subirlos a tu cuenta?")) {

            const colorRows = Object.entries(local)
                .filter(([, d]) => d.color)
                .map(([day, d]) => ({ day, color: d.color }));

            const reminderRows = Object.entries(local)
                .flatMap(([day, d]) => (d.events || []).map((e) => ({ day, text: e.text })));

            if (colorRows.length) await sb.from("calendar_days").upsert(colorRows);
            if (reminderRows.length) await sb.from("reminders").insert(reminderRows);

            cloud = false;
            badge.remove();
            return initCloud();
        }

        renderCalendar();
    }

    function cloudError() {
        alert("No se ha podido guardar en tu cuenta. Revisa la conexión e inténtalo otra vez.");
    }

    function keyFor(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function colorHex(id) {
        const found = DAY_COLORS.find((c) => c.id === id);
        return found ? found.hex : null;
    }


    function renderCalendar() {

        if (!calendarGrid) return;

        calendarGrid.innerHTML = "";

        const year =
            displayedDate.getFullYear();

        const month =
            displayedDate.getMonth();

        calendarMonth.textContent =
            `${monthNames[month]} ${year}`;


        const firstDay =
            new Date(year, month, 1).getDay();

        const startingDay =
            firstDay === 0
                ? 6
                : firstDay - 1;


        const daysInMonth =
            new Date(year, month + 1, 0).getDate();


        const daysPreviousMonth =
            new Date(year, month, 0).getDate();


        /* Previous month */

        for (
            let i = startingDay - 1;
            i >= 0;
            i--
        ) {

            const day =
                daysPreviousMonth - i;

            const cell =
                createDayCell(
                    day,
                    true
                );

            calendarGrid.appendChild(cell);
        }


        /* Current month */

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const cell =
                createDayCell(
                    day,
                    false
                );

            calendarGrid.appendChild(cell);
        }


        /* Next month */

        const totalCells =
            calendarGrid.children.length;

        const remaining =
            totalCells % 7 === 0
                ? 0
                : 7 - (totalCells % 7);


        for (
            let day = 1;
            day <= remaining;
            day++
        ) {

            const cell =
                createDayCell(
                    day,
                    true
                );

            calendarGrid.appendChild(cell);
        }


        updateSelectedDate();
    }


    function createDayCell(
        day,
        otherMonth
    ) {

        const cell =
            document.createElement("div");


        cell.className =
            "calendar-day";


        cell.textContent =
            day;


        if (otherMonth) {

            cell.classList.add(
                "other-month"
            );

            return cell;
        }


        const cellDate =
            new Date(
                displayedDate.getFullYear(),
                displayedDate.getMonth(),
                day
            );


        const isToday =
            cellDate.toDateString() ===
            now.toDateString();


        const isSelected =
            cellDate.toDateString() ===
            selected.toDateString();


        if (isToday) {

            cell.classList.add(
                "today"
            );
        }


        if (isSelected) {

            cell.classList.add(
                "selected"
            );
        }


        // Color y nota marcados en este día (nuevo)
        const info = dayData[keyFor(cellDate)];

        if (info && info.color && !isToday) {

            const hex = colorHex(info.color);

            if (hex) {
                cell.style.background = hex;
                cell.style.color =
                    info.color === "forest" ? "white" : "var(--forest)";
            }
        }

        if (info && info.events && info.events.length) {

            cell.classList.add("marked");

            if (isToday) {
                cell.style.color = "var(--yellow)";
            } else if (!(info.color)) {
                cell.style.color = "var(--forest)";
            }
        }


        cell.addEventListener(
            "click",
            () => {

                selected =
                    new Date(cellDate);

                renderCalendar();
            }
        );


        return cell;
    }


    function updateSelectedDate() {

        const formatted =
            selected.toLocaleDateString(
                "es-ES",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );


        selectedDate.textContent =
            formatted.charAt(0).toUpperCase() +
            formatted.slice(1);

        renderColorPicker();
        renderDayEvents();
    }


    previousMonth.addEventListener(
        "click",
        () => {

            displayedDate =
                new Date(
                    displayedDate.getFullYear(),
                    displayedDate.getMonth() - 1,
                    1
                );

            renderCalendar();
        }
    );


    nextMonth.addEventListener(
        "click",
        () => {

            displayedDate =
                new Date(
                    displayedDate.getFullYear(),
                    displayedDate.getMonth() + 1,
                    1
                );

            renderCalendar();
        }
    );


    todayButton.addEventListener(
        "click",
        () => {

            displayedDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

            selected =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                );

            renderCalendar();
        }
    );


    /* ---------------------------------
       Selector de color para el día
    --------------------------------- */

    const dayColorPicker =
        document.getElementById("dayColorPicker");

    function renderColorPicker() {

        if (!dayColorPicker) return;

        const key = keyFor(selected);
        const current = dayData[key] && dayData[key].color;

        dayColorPicker.innerHTML = "";

        DAY_COLORS.forEach((color) => {

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = current === color.id ? "active" : "";
            btn.innerHTML =
                `<span class="swatch" style="background:${color.hex}"></span>${color.label}`;

            btn.addEventListener("click", () => {

                if (!dayData[key]) {
                    dayData[key] = { color: null, events: [] };
                }

                // Pulsar el mismo color otra vez lo quita
                dayData[key].color =
                    dayData[key].color === color.id ? null : color.id;

                if (cloud) {
                    const newColor = dayData[key].color;
                    (newColor
                        ? sb.from("calendar_days").upsert({ day: key, color: newColor })
                        : sb.from("calendar_days").delete().eq("day", key)
                    ).then(({ error }) => { if (error) cloudError(); });
                }

                saveDayData(dayData);
                renderCalendar();
            });

            dayColorPicker.appendChild(btn);
        });
    }


    /* ---------------------------------
       Notas del día
    --------------------------------- */

    const dayEventForm =
        document.getElementById("dayEventForm");

    const dayEventInput =
        document.getElementById("dayEventInput");

    const dayEventList =
        document.getElementById("dayEventList");

    function renderDayEvents() {

        if (!dayEventList) return;

        const key = keyFor(selected);
        const info = dayData[key];
        const events = (info && info.events) || [];

        dayEventList.innerHTML = "";

        if (!events.length) {

            dayEventList.innerHTML =
                `<li class="day-event-empty" style="background:none; padding:0;">Todavía no has añadido nada para este día.</li>`;

            return;
        }

        const swatchHex =
            (info && info.color && colorHex(info.color)) || "#77827c";

        events.forEach((event) => {

            const li = document.createElement("li");

            li.innerHTML = `
                <span class="swatch" style="background:${swatchHex}"></span>
                <span class="ev-text"></span>
                <span class="ev-delete">eliminar</span>
            `;

            li.querySelector(".ev-text").textContent = event.text;

            li.querySelector(".ev-delete").addEventListener("click", () => {

                if (cloud) {
                    sb.from("reminders").delete().eq("id", event.id)
                        .then(({ error }) => { if (error) cloudError(); });
                }

                dayData[key].events =
                    dayData[key].events.filter((e) => e.id !== event.id);

                saveDayData(dayData);
                renderDayEvents();
                renderCalendar();
            });

            dayEventList.appendChild(li);
        });
    }

    if (dayEventForm) {

        dayEventForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const text = dayEventInput.value.trim();

            if (!text) return;

            const key = keyFor(selected);

            let id = Date.now().toString();

            if (cloud) {
                const { data, error } = await sb.from("reminders")
                    .insert({ day: key, text })
                    .select("id")
                    .single();

                if (error) return cloudError();

                id = data.id;
            }

            if (!dayData[key]) {
                dayData[key] = { color: null, events: [] };
            }

            dayData[key].events.push({
                id,
                text
            });

            saveDayData(dayData);

            dayEventInput.value = "";

            renderDayEvents();
            renderCalendar();
        });
    }


    renderCalendar();

    initCloud();


    /* =================================
       SUPABASE COMMENTS
    ================================= */

    /*
       PON AQUÍ LOS DATOS DE TU PROYECTO
    */


    const SUPABASE_URL =
        "https://uaojfcqpdngoqpjrmttx.supabase.co";


    const SUPABASE_ANON_KEY =
        "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q";


    const form =
        document.getElementById(
            "commentForm"
        );


    const nameInput =
        document.getElementById(
            "commentName"
        );


    const textInput =
        document.getElementById(
            "commentText"
        );


    const submitButton =
        document.getElementById(
            "commentSubmit"
        );


    const status =
        document.getElementById(
            "commentStatus"
        );


    const commentsList =
        document.getElementById(
            "commentsList"
        );


    const supabaseReady =
        SUPABASE_URL &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_ANON_KEY.includes(
            "PEGA_AQUI"
        );


    if (!supabaseReady) {

        submitButton.disabled = true;

        status.textContent =
            "Comentarios públicos: conecta Supabase para activarlos.";
    }


    async function loadComments() {

        if (!supabaseReady) return;


        try {

            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/comments?select=id,name,message,created_at&order=created_at.desc`,
                    {
                        method: "GET",

                        headers: {
                            apikey:
                                SUPABASE_ANON_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "Supabase:",
                    errorText
                );

                throw new Error(
                    "No se pudieron cargar los comentarios."
                );
            }


            const comments =
                await response.json();


            renderComments(comments);


        } catch (error) {

            console.error(error);

            status.textContent =
                "No se han podido cargar los comentarios.";
        }
    }


    function renderComments(
        comments
    ) {

        commentsList.innerHTML = "";


        if (!comments.length) {

            commentsList.innerHTML = `
                <div class="comments-empty">
                    <span>✦</span>
                    <p>
                        Todavía no hay comentarios.
                    </p>
                </div>
            `;

            return;
        }


        comments.forEach(comment => {

            const article =
                document.createElement("article");


            article.className =
                "comment-card";


            const date =
                new Date(
                    comment.created_at
                ).toLocaleDateString(
                    "es-ES",
                    {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }
                );


            article.innerHTML = `
                <div class="comment-card-top">

                    <span class="comment-name">
                        ${escapeHTML(comment.name)}
                    </span>

                    <span class="comment-date">
                        ${date}
                    </span>

                </div>

                <p class="comment-message">
                    ${escapeHTML(comment.message)}
                </p>
            `;


            commentsList.appendChild(
                article
            );

        });
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!supabaseReady) return;


            const name =
                nameInput.value.trim();


            const message =
                textInput.value.trim();


            if (!name || !message) {

                status.textContent =
                    "Completa los dos campos.";

                return;
            }


            if (name.length > 50) {

                status.textContent =
                    "El nombre no puede superar los 50 caracteres.";

                return;
            }


            if (message.length > 500) {

                status.textContent =
                    "El comentario no puede superar los 500 caracteres.";

                return;
            }


            submitButton.disabled = true;

            status.textContent =
                "Publicando...";


            try {

                const response =
                    await fetch(
                        `${SUPABASE_URL}/rest/v1/comments`,
                        {
                            method: "POST",

                            headers: {
                                apikey:
                                    SUPABASE_ANON_KEY,

                                Authorization:
                                    `Bearer ${SUPABASE_ANON_KEY}`,

                                "Content-Type":
                                    "application/json",

                                Prefer:
                                    "return=minimal"
                            },

                            body: JSON.stringify({
                                name,
                                message
                            })
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.error(
                        "Supabase:",
                        errorText
                    );

                    throw new Error(
                        "No se pudo publicar."
                    );
                }


                nameInput.value = "";

                textInput.value = "";


                status.textContent =
                    "Comentario publicado.";


                await loadComments();


            } catch (error) {

                console.error(error);

                status.textContent =
                    "No se ha podido publicar el comentario.";
            }


            submitButton.disabled =
                !supabaseReady;
        }
    );


    function escapeHTML(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    loadComments();

});
