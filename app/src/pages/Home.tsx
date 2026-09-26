import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Booking } from "@/components/Booking";
import { CountUp, EditorialMarquee, Entrance, HeroTitle, Magnetic, ProfileParallax, ProjectPreview, Reveal } from "@/components/EditorialEffects";
import { usePageTitle } from "@/components/SiteChrome";
import { asset } from "@/lib/supabase";

export const CV_PDF = "https://mariete431-svg.github.io/MarioIglesias/cv%202025.pdf";

const experience = [
  { year: "2025", role: "Inside LVMH Certificate", place: "Curso online", detail: "Operations & Supply Chain, Retail & Client Experience." },
  { year: "Mar 2024 — Dic 2025", role: "Ayudante de cocina", place: "Restaurante Marietta · Gourmetland, Adeje", detail: "Preparación, orden y ritmo de servicio; trabajo bajo presión y en equipo sin perder el detalle." },
  { year: "Mar 2023 — Oct 2023", role: "Atención al cliente", place: "Perfumerías Primor · Goya, Madrid", detail: "Cobros, pedidos y resolución de incidencias con clientes." },
  { year: "Mar 2022 — Ene 2023", role: "Operario de restaurante", place: "Burger King · Collado Villalba", detail: "Servicio rápido, trabajo en equipo y atención al público." },
  { year: "2019", role: "Ayudante de limpieza", place: "Sersinor · Collado Villalba", detail: "Constancia y responsabilidad." },
  { year: "2018 — 2021", role: "Auxiliar en fiestas infantiles", place: "Primer trabajo", detail: "Trato con familias y organización." },
  { year: "2015 — 2019", role: "Graduado en ESO", place: "IES María Guerrero · Collado Villalba", detail: "Educación secundaria obligatoria." },
];
const projects = [
  { name: "Web personal", description: "Diseñada y programada por mí.", to: "#inicio" },
  { name: "Lista de tareas", description: "Organización sencilla para el día a día.", to: "/tareas" },
  { name: "Panel personal", description: "Un espacio para tenerlo todo en orden.", to: "/panel" },
  { name: "Creador de CV", description: "Una herramienta para presentar tu experiencia.", to: "/crear-cv" },
  { name: "Edición de vídeo", description: "En proceso.", to: "" },
];

export default function Home() {
  usePageTitle("Mario Iglesias — Atención al cliente y desarrollo web");
  const [openExperience, setOpenExperience] = useState<number | null>(null);
  return <>
    <Entrance />
    <main id="inicio">
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-content"><Reveal immediate><p className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> ADEJE, TENERIFE — 2026</p></Reveal>
          <HeroTitle />
          <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: .7 }}>Atención al cliente, organización y desarrollo web.<br className="desktop-break" /> Detalle, discreción y trabajo bien hecho.</motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.22, duration: .7 }}><Magnetic><Button variant="luxury" size="lg" asChild><a href="#reservar" data-cursor="Reservar">Reservar una reunión <ArrowUpRight /></a></Button></Magnetic><Magnetic><Button variant="outlineLuxury" size="lg" asChild><Link to="/cv" data-cursor="Ver">Ver CV <ArrowUpRight /></Link></Button></Magnetic></motion.div>
        </div>
        <div className="hero-bottom"><span>01 / PRESENTACIÓN</span><a href="#perfil" aria-label="Bajar al perfil">DESLIZA PARA DESCUBRIR <ArrowDown size={15} strokeWidth={1.5} /></a></div>
      </section>

      <section id="perfil" className="profile-section section-pad"><div className="section-wrap">
        <Reveal><div className="section-heading"><span className="eyebrow">01 / PERFIL</span><span className="section-rule" /></div></Reveal>
        <div className="profile-grid"><div className="profile-quote"><ProfileParallax direction={-1}><Reveal><h2>El valor de<br /><em>hacerlo bien.</em></h2><blockquote>“Un profesional trabajador, con ganas de aprender y facilidad para trabajar en equipo.”</blockquote></Reveal></ProfileParallax></div>
          <div className="profile-details"><Reveal><p>He trabajado en cocina, perfumería y restauración. De cada experiencia he aprendido algo fundamental: las cosas bien hechas se notan en los detalles.</p><p>Hoy llevo esa misma atención, curiosidad y compromiso al mundo de la web. Me interesa crear, aprender y aportar valor donde pueda marcar la diferencia.</p></Reveal>
            <ProfileParallax><Reveal><div className="portrait"><motion.img src={asset("foto.jpg")} alt="Retrato de Mario Iglesias Martínez" loading="lazy" initial={{ scale: 1.14 }} whileInView={{ scale: 1.03 }} viewport={{ once: true }} transition={{ duration: 2.2, ease: [.2, .7, .2, 1] }} /></div></Reveal></ProfileParallax>
          </div></div>
        <Reveal><div className="facts"><div><span>BASE</span><strong>Adeje, Tenerife</strong></div><div><span>DISPONIBILIDAD</span><strong>Total, España</strong></div><div><span>IDIOMAS</span><strong>Español nativo, Inglés medio</strong></div></div></Reveal>
        <Reveal><div className="metrics" aria-label="Resumen de experiencia"><div><strong><CountUp to={7} /></strong><span>ETAPAS DE FORMACIÓN Y TRABAJO</span></div><div><strong><CountUp to={3} /></strong><span>ÁMBITOS DE EXPERIENCIA</span></div><div><strong><CountUp to={2} /></strong><span>IDIOMAS</span></div></div></Reveal>
      </div></section>

      <section id="trayectoria" className="career-section section-pad"><div className="section-wrap">
        <Reveal><div className="section-heading"><span className="eyebrow">02 / TRAYECTORIA</span><span className="section-rule" /></div><div className="intro-row"><h2>Un camino de<br /><em>aprendizaje.</em></h2><p>Cada etapa deja una forma distinta de mirar el trabajo. Todas suman.</p></div></Reveal>
        <div className="career-list"><motion.span className="career-timeline" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: .1 }} transition={{ duration: 1.8, ease: [.2, .7, .2, 1] }} />{experience.map((entry, i) => <Reveal key={entry.role + entry.year}><motion.div className={`career-item ${openExperience === i ? "is-open" : ""}`} initial={{ opacity: .48 }} whileInView={{ opacity: 1 }} viewport={{ amount: .55 }} transition={{ duration: .45 }}><Button variant="text" className="career-toggle" aria-expanded={openExperience === i} onClick={() => setOpenExperience(openExperience === i ? null : i)}><span className="career-year">{entry.year}</span><span className="career-main"><strong>{entry.role}</strong><small>{entry.place}</small></span><span className="career-icon">{openExperience === i ? <Minus /> : <Plus />}</span></Button><motion.div initial={false} animate={{ height: openExperience === i ? "auto" : 0, opacity: openExperience === i ? 1 : 0 }} transition={{ duration: .48, ease: [.22, 1, .36, 1] }} className="career-detail"><p>{entry.detail}</p></motion.div></motion.div></Reveal>)}</div>
        <Reveal><div className="hero-actions"><Button variant="outlineLuxury" size="lg" asChild><Link to="/cv">CV completo <ArrowUpRight /></Link></Button><Button variant="outlineLuxury" size="lg" asChild><a href={CV_PDF} target="_blank" rel="noopener noreferrer">Descargar CV (PDF) <ArrowUpRight /></a></Button></div></Reveal>
      </div></section>

      <EditorialMarquee />

      <section className="skills-section section-pad"><div className="section-wrap"><Reveal><div className="section-heading"><span className="eyebrow">03 / COMPETENCIAS</span><span className="section-rule" /></div><h2>Lo que puedo <em>aportar.</em></h2></Reveal><div className="skills-grid">{[
        ["01", "Atención al cliente", "Trato cercano, resolución de incidencias, cobros y pedidos."],
        ["02", "Organización", "Trabajo bajo presión, orden y trabajo en equipo."],
        ["03", "Web", "HTML, CSS, JavaScript, Git y GitHub — en aprendizaje continuo."],
      ].map(([number, title, description]) => <Reveal key={title}><article className="skill"><span className="eyebrow">{number}</span><h3>{title}</h3><p>{description}</p></article></Reveal>)}</div></div></section>

      <section id="proyectos" className="projects-section section-pad"><div className="section-wrap"><Reveal><div className="section-heading"><span className="eyebrow">04 / PROYECTOS</span><span className="section-rule" /></div><div className="intro-row"><h2>Ideas hechas<br /><em>realidad.</em></h2><p>Una selección de trabajos y proyectos personales.</p></div></Reveal><div className="project-list">{projects.map((project, i) => {
        const inner = <><span className="project-number">0{i + 1}</span><strong>{project.name}</strong><span className="project-description">{project.description}</span></>;
        return <Reveal key={project.name}><ProjectPreview name={project.name}>{!project.to
          ? <div className="project-row project-inactive">{inner}<span className="project-dash">—</span></div>
          : project.to.startsWith("#")
            ? <a className="project-row" href={project.to}>{inner}<ArrowUpRight className="project-arrow" strokeWidth={1.25} /></a>
            : <Link className="project-row" to={project.to}>{inner}<ArrowUpRight className="project-arrow" strokeWidth={1.25} /></Link>}
        </ProjectPreview></Reveal>;
      })}</div></div></section>

      <section id="reservar" className="reserve-section section-pad"><div className="section-wrap"><Reveal><div className="section-heading"><span className="eyebrow">05 / RESERVAR REUNIÓN</span><span className="section-rule" /></div><div className="reserve-intro"><h2>Empecemos con<br /><em>una conversación.</em></h2><p>Reserva un espacio para hablar de ideas, proyectos o posibilidades de colaboración.</p></div></Reveal><Reveal><Booking /></Reveal></div></section>

      <section id="contacto" className="contact-section section-pad"><div className="section-wrap"><Reveal><div className="section-heading"><span className="eyebrow">06 / CONTACTO</span><span className="section-rule" /></div><p className="contact-lead">PARA TODO LO DEMÁS</p><h2>Hablemos<span>.</span></h2><a className="contact-email" href="mailto:mariete431@icloud.com">mariete431@icloud.com <ArrowUpRight strokeWidth={1.2} /></a><div className="contact-links"><a href="https://www.instagram.com/Whsmario/" target="_blank" rel="noopener noreferrer">Instagram <ArrowUpRight size={16} /></a><a href="#reservar">Reservar una reunión <ArrowUpRight size={16} /></a></div></Reveal></div></section>
    </main>
  </>;
}
