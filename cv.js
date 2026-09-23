document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       REVEAL ON SCROLL
    ========================= */

    const revealElements = document.querySelectorAll(
        ".section, .experience-item, .skill, .other-item, .certificate-content"
    );

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.12
        }
    );


    revealElements.forEach((element) => {
        element.classList.add("reveal");
        observer.observe(element);
    });


    /* =========================
       PHOTO PARALLAX
    ========================= */

    const photo = document.querySelector(".photo-frame");

    if (photo) {

        window.addEventListener("mousemove", (event) => {

            const x = (event.clientX / window.innerWidth - 0.5);
            const y = (event.clientY / window.innerHeight - 0.5);

            if (window.innerWidth > 900) {

                photo.style.transform = `
                    rotate(3deg)
                    perspective(900px)
                    rotateY(${x * -8}deg)
                    rotateX(${y * 5}deg)
                `;

            }

        });

    }


    /* =========================
       MAGNETIC BUTTONS
    ========================= */

    const buttons = document.querySelectorAll(".button");

    buttons.forEach((button) => {

        button.addEventListener("mousemove", (event) => {

            if (window.innerWidth <= 700) return;

            const rect = button.getBoundingClientRect();

            const x =
                event.clientX -
                rect.left -
                rect.width / 2;

            const y =
                event.clientY -
                rect.top -
                rect.height / 2;

            button.style.transform = `
                translate(${x * 0.08}px, ${y * 0.08}px)
            `;

        });


        button.addEventListener("mouseleave", () => {

            button.style.transform = "";

        });

    });


    /* =========================
       EXPERIENCE HOVER
    ========================= */

    const experienceItems =
        document.querySelectorAll(".experience-item");


    experienceItems.forEach((item) => {

        item.addEventListener("mouseenter", () => {

            item.style.transform =
                "translateX(8px)";

        });


        item.addEventListener("mouseleave", () => {

            item.style.transform =
                "translateX(0)";

        });

    });


    /* =========================
       CURRENT YEAR
    ========================= */

    const year = document.querySelector("footer span:last-child");

    if (year) {
        year.textContent =
            `© ${new Date().getFullYear()}`;
    }

});
