document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       REVEAL ON SCROLL
    ========================== */

    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    revealObserver.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.12
        }
    );

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });


    /* =========================
       CURSOR GLOW
    ========================== */

    const cursor = document.querySelector(".cursor-glow");

    if (cursor && window.matchMedia("(pointer: fine)").matches) {

        document.addEventListener("mousemove", event => {

            cursor.style.left = `${event.clientX}px`;
            cursor.style.top = `${event.clientY}px`;
            cursor.style.opacity = "1";

        });

        document.addEventListener("mouseleave", () => {
            cursor.style.opacity = "0";
        });

    }


    /* =========================
       MAGNETIC BUTTONS
    ========================== */

    const magneticButtons =
        document.querySelectorAll(".magnetic-button");

    magneticButtons.forEach(button => {

        button.addEventListener("pointermove", event => {

            const rect = button.getBoundingClientRect();

            const x =
                ((event.clientX - rect.left) / rect.width) * 100;

            const y =
                ((event.clientY - rect.top) / rect.height) * 100;

            button.style.setProperty("--mouse-x", `${x}%`);
            button.style.setProperty("--mouse-y", `${y}%`);

            const moveX =
                (event.clientX - rect.left - rect.width / 2) * 0.08;

            const moveY =
                (event.clientY - rect.top - rect.height / 2) * 0.08;

            button.style.transform =
                `translate(${moveX}px, ${moveY}px) translateZ(10px)`;

        });

        button.addEventListener("pointerleave", () => {

            button.style.transform =
                "";

        });

    });


    /* =========================
       3D TILT CARDS
    ========================== */

    const cards =
        document.querySelectorAll(".tilt-card");

    if (window.matchMedia("(pointer: fine)").matches) {

        cards.forEach(card => {

            card.addEventListener("pointermove", event => {

                const rect =
                    card.getBoundingClientRect();

                const x =
                    event.clientX - rect.left;

                const y =
                    event.clientY - rect.top;

                const centerX =
                    rect.width / 2;

                const centerY =
                    rect.height / 2;

                const rotateY =
                    ((x - centerX) / centerX) * 5;

                const rotateX =
                    ((centerY - y) / centerY) * 5;

                card.style.transform =
                    `perspective(1200px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)
                     translateZ(8px)`;

            });


            card.addEventListener("pointerleave", () => {

                card.style.transform =
                    "";

            });

        });

    }


    /* =========================
       HERO PARALLAX
    ========================== */

    const orbOne =
        document.querySelector(".hero-orb-one");

    const orbTwo =
        document.querySelector(".hero-orb-two");

    if (
        orbOne &&
        orbTwo &&
        window.matchMedia("(pointer: fine)").matches
    ) {

        window.addEventListener("mousemove", event => {

            const x =
                (event.clientX / window.innerWidth - .5);

            const y =
                (event.clientY / window.innerHeight - .5);

            orbOne.style.transform =
                `translate3d(${x * -25}px, ${y * -25}px, 40px)`;

            orbTwo.style.transform =
                `translate3d(${x * 35}px, ${y * 35}px, 80px)`;

        });

    }


    /* =========================
       NAV ACTIVE SECTION
    ========================== */

    const sections =
        document.querySelectorAll("section[id]");

    const navLinks =
        document.querySelectorAll(".nav-links a");

    const sectionObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) return;

                    navLinks.forEach(link => {
                        link.classList.remove("active");
                    });

                    const active =
                        document.querySelector(
                            `.nav-links a[href="#${entry.target.id}"]`
                        );

                    if (active) {
                        active.classList.add("active");
                    }

                });

            },
            {
                rootMargin: "-30% 0px -60% 0px"
            }
        );

    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    /* =========================
       CURRENT YEAR
    ========================== */

    const currentYear =
        new Date().getFullYear();

    document.querySelectorAll(".footer").forEach(footer => {

        footer.innerHTML =
            footer.innerHTML.replace(
                "© 2026",
                `© ${currentYear}`
            );

    });

});
