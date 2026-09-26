document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;


    /* =========================
       REVEAL ON SCROLL
    ========================== */

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries
                .filter(entry => entry.isIntersecting)
                .forEach((entry, index) => {
                    entry.target.style.setProperty("--delay", `${index * 0.08}s`);
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));


    /* =========================
       SCROLL: NAV, PROGRESO, PARALLAX, TIMELINE
    ========================== */

    const header = document.querySelector(".site-header");
    const progressBar = document.querySelector(".progress-bar");
    const hero = document.querySelector(".hero");
    const layers = document.querySelectorAll(".scene .layer");
    const chaptersNav = document.querySelector(".chapters");
    const timeline = document.getElementById("timeline");
    const tlItems = [...document.querySelectorAll(".tl-item")];
    const darkSections = document.querySelectorAll(".chapter-dark, .contact, .footer");

    let pointerX = 0;
    let pointerY = 0;

    const updateParallax = () => {
        if (reduceMotion) return;
        const scrollY = Math.min(window.scrollY, window.innerHeight);
        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth || 0);
            const x = pointerX * depth * -40;
            const y = scrollY * depth * 0.6 + pointerY * depth * -20;
            layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    };

    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const heroEnd = hero.offsetHeight - 80;

        header.classList.toggle("solid", y > heroEnd);
        chaptersNav.classList.toggle("show", y > heroEnd);
        progressBar.style.setProperty("--p", max > 0 ? y / max : 0);

        // ¿Estamos sobre una zona oscura? (cambia colores de nav y cursor)
        const probe = window.innerHeight * 0.5;
        const onDark = y > heroEnd && [...darkSections].some(section => {
            const r = section.getBoundingClientRect();
            return r.top < probe && r.bottom > probe;
        });
        document.body.classList.toggle("on-dark", onDark);

        // Línea de la timeline que se rellena
        const r = timeline.getBoundingClientRect();
        const fill = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
        timeline.style.setProperty("--tl", fill);
        tlItems.forEach(item => {
            const top = item.getBoundingClientRect().top;
            item.classList.toggle("lit", top < window.innerHeight * 0.6);
        });

        if (y < window.innerHeight) updateParallax();
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            onScroll();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener("resize", onScroll);
    onScroll();

    if (finePointer) {
        hero.addEventListener("pointermove", event => {
            pointerX = event.clientX / window.innerWidth - 0.5;
            pointerY = event.clientY / window.innerHeight - 0.5;
            requestAnimationFrame(updateParallax);
        });
    }


    /* =========================
       CAPÍTULO ACTIVO
    ========================== */

    const chapterLinks = document.querySelectorAll(".chapters a, .nav-links a");

    const chapterObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                chapterLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
                });
            });
        },
        { rootMargin: "-45% 0px -50% 0px" }
    );

    document.querySelectorAll("section[id]").forEach(s => chapterObserver.observe(s));


    /* =========================
       MENÚ MÓVIL
    ========================== */

    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");

    const setMenu = (isOpen) => {
        links.classList.toggle("open", isOpen);
        toggle.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
        header.classList.toggle("menu-open", isOpen);
    };

    toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });


    /* =========================
       INCLINACIÓN 3D (objetos, retrato, proyectos)
    ========================== */

    if (finePointer && !reduceMotion) {
        document.querySelectorAll("[data-tilt]").forEach(card => {
            const target = card;
            const max = card.classList.contains("object") ? 14 : 5;

            card.addEventListener("pointermove", event => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                target.classList.add("tilting");
                target.style.setProperty("--ry", `${x * max * 2}deg`);
                target.style.setProperty("--rx", `${y * -max * 2}deg`);
            });

            card.addEventListener("pointerleave", () => {
                target.classList.remove("tilting");
                target.style.setProperty("--rx", "0deg");
                target.style.setProperty("--ry", "0deg");
            });
        });
    }


    /* =========================
       CURSOR
    ========================== */

    if (finePointer && !reduceMotion) {
        const cursor = document.querySelector(".cursor");
        const dot = cursor.querySelector(".cursor-dot");
        const ring = cursor.querySelector(".cursor-ring");
        const label = cursor.querySelector(".cursor-label");

        document.documentElement.classList.add("has-cursor");

        let mx = -100, my = -100;   // ratón
        let rx = -100, ry = -100;   // anillo (le sigue con suavidad)
        let vx = 0, vy = 0;

        document.addEventListener("pointermove", e => {
            mx = e.clientX;
            my = e.clientY;
            dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
            cursor.classList.add("visible");
        });

        document.addEventListener("pointerleave", () => cursor.classList.remove("visible"));
        document.addEventListener("pointerdown", () => cursor.classList.add("down"));
        document.addEventListener("pointerup", () => cursor.classList.remove("down"));

        // Muelle críticamente amortiguado: sigue sin rebotar
        const stiffness = 0.18;
        const damping = 0.62;

        const loop = () => {
            vx = (vx + (mx - rx) * stiffness) * damping;
            vy = (vy + (my - ry) * stiffness) * damping;
            rx += vx;
            ry += vy;
            ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
            requestAnimationFrame(loop);
        };
        loop();

        const interactive = "a, button, [data-cursor]";

        document.addEventListener("pointerover", e => {
            const el = e.target.closest(interactive);
            if (!el) return;
            label.textContent = el.dataset.cursor || "";
            cursor.classList.add("hover");
        });

        document.addEventListener("pointerout", e => {
            const el = e.target.closest(interactive);
            if (el && !el.contains(e.relatedTarget)) cursor.classList.remove("hover");
        });
    }


    /* =========================
       TIMELINE INTERACTIVA
    ========================== */

    tlItems.forEach(item => {
        const head = item.querySelector(".tl-head");
        head.addEventListener("click", () => {
            const isOpen = item.classList.toggle("open");
            head.setAttribute("aria-expanded", String(isOpen));
        });
    });

    // Abrir la primera etapa de trabajo como ejemplo
    const firstWork = tlItems.find(i => i.dataset.type === "work");
    if (firstWork) firstWork.querySelector(".tl-head").click();

    const filters = document.querySelectorAll(".filter");

    filters.forEach(button => {
        button.addEventListener("click", () => {
            const type = button.dataset.filter;
            filters.forEach(b => {
                b.classList.toggle("active", b === button);
                b.setAttribute("aria-pressed", String(b === button));
            });
            tlItems.forEach(item => {
                item.classList.toggle("is-hidden", type !== "all" && item.dataset.type !== type);
            });
            onScroll();
        });
    });


    /* =========================
       EASTER EGG: BROWNIE
       Escribe "brownie" o toca su tarjeta 3 veces
    ========================== */

    const egg = document.getElementById("egg");
    let typed = "";
    let running = false;

    const releaseBrownie = () => {
        if (running) return;
        running = true;
        egg.classList.remove("run");
        void egg.offsetWidth;
        egg.classList.add("run");
        setTimeout(() => {
            egg.classList.remove("run");
            running = false;
        }, reduceMotion ? 2500 : 4400);
    };

    document.addEventListener("keydown", e => {
        if (e.target.closest?.("input, textarea, [contenteditable]")) return;
        if (e.key.length !== 1) return;
        typed = (typed + e.key.toLowerCase()).slice(-7);
        if (typed === "brownie") releaseBrownie();
    });

    let taps = 0;
    let tapTimer;
    document.getElementById("brownieCard").addEventListener("click", () => {
        taps++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { taps = 0; }, 900);
        if (taps >= 3) {
            taps = 0;
            releaseBrownie();
        }
    });

    console.log(
        "%c🐾 Hola, curioso/a. Escribe \"brownie\" en la página y verás…",
        "font: 14px/1.6 sans-serif; color: #1e3a2b; background: #f7e3a3; padding: 6px 10px; border-radius: 6px;"
    );


    /* =========================
       AÑO ACTUAL
    ========================== */

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

});
