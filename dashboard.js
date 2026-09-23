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


    function renderCalendar() {

        if (!calendarGrid) return;


        calendarGrid.innerHTML = "";


        const year =
            displayedDate.getFullYear();

        const month =
            displayedDate.getMonth();


        calendarMonth.textContent =
            `${monthNames[month]} ${year}`;


        /*
            JS:
            0 = domingo
            Nosotros queremos:
            0 = lunes
        */

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


    renderCalendar();


    /* =================================
       SUPABASE COMMENTS
    ================================= */

    /*
        IMPORTANTE:

        GitHub Pages no puede guardar comentarios
        en una base de datos por sí solo.

        Para activar comentarios públicos reales,
        configura estas dos variables:

        window.SUPABASE_URL
        window.SUPABASE_ANON_KEY

        No pongas aquí la SERVICE_ROLE KEY.
    */


    const SUPABASE_URL =
        window.SUPABASE_URL || "";


    const SUPABASE_ANON_KEY =
        window.SUPABASE_ANON_KEY || "";


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
        SUPABASE_ANON_KEY;


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
                        headers: {
                            apikey:
                                SUPABASE_ANON_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    }
                );


            if (!response.ok) {

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
