import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroTitle, Magnetic, Reveal } from "@/components/EditorialEffects";

const navigation = [
  { label: "Perfil", to: "/#perfil" },
  { label: "Trayectoria", to: "/#trayectoria" },
  { label: "Proyectos", to: "/#proyectos" },
  { label: "CV", to: "/cv" },
  { label: "Contacto", to: "/#contacto" },
];

/** En la portada los enlaces de sección son anclas normales; en el resto, llevan a la portada. */
function useHref(to: string) {
  const { pathname } = useLocation();
  return pathname === "/" && to.startsWith("/#") ? to.slice(1) : to;
}

function NavItem({ to, className, onClick, children }: { to: string; className?: string; onClick?: () => void; children: ReactNode }) {
  const href = useHref(to);
  if (href.startsWith("#")) return <a href={href} className={className} onClick={onClick}>{children}</a>;
  if (to.includes("#")) return <Link to={to} className={className} onClick={onClick}>{children}</Link>;
  return <NavLink to={to} className={({ isActive }) => `${className ?? ""} ${isActive ? "active" : ""}`} onClick={onClick}>{children}</NavLink>;
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return <>
    <header className="site-header"><div className="header-inner">
      <NavItem to="/#inicio" className="brand"><span aria-label="Mario Iglesias, volver al inicio">Mario Iglesias<span className="brand-dot">.</span></span></NavItem>
      <nav className="desktop-nav" aria-label="Navegación principal">{navigation.map(item => <NavItem key={item.label} to={item.to} className="nav-link">{item.label}</NavItem>)}</nav>
      <NavItem to="/#reservar" className="header-book">Reservar reunión <ArrowUpRight size={15} strokeWidth={1.5} /></NavItem>
      <Button variant="text" size="icon" className="menu-trigger" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X /> : <Menu />}</Button>
    </div></header>
    {menuOpen && <motion.nav className="mobile-menu" aria-label="Navegación móvil" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, ease: [.22, 1, .36, 1] }}>
      {navigation.map((item, i) => <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 + i * .05, duration: .45 }}><NavItem to={item.to} onClick={() => setMenuOpen(false)}><span>0{i + 1}</span>{item.label}<ArrowUpRight /></NavItem></motion.div>)}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .45 }}><NavItem to="/#reservar" onClick={() => setMenuOpen(false)}><span>06</span>Reservar reunión<ArrowUpRight /></NavItem></motion.div>
      <p>Adeje, Tenerife — 2026</p>
    </motion.nav>}
  </>;
}

export function SiteFooter() {
  return <footer className="footer"><div className="section-wrap">
    <span>© 2026 Mario Iglesias · Adeje, Tenerife</span>
    <Link to="/admin">Panel <ArrowUpRight size={13} /></Link>
  </div></footer>;
}

/** Portada de las páginas interiores, con el mismo lenguaje que la portada principal. */
export function PageHero({ eyebrow, lines, subtitle, actions, bottom = "Desliza para descubrir", bottomHref }: {
  eyebrow: string; lines: string[]; subtitle?: ReactNode; actions?: ReactNode; bottom?: string; bottomHref?: string;
}) {
  return <section className="page-hero section-wrap" aria-labelledby="page-title">
    <div className="hero-content">
      <Reveal immediate><p className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> {eyebrow}</p></Reveal>
      <HeroTitle lines={lines} id="page-title" delay={.15} />
      {subtitle && <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .75, duration: .7 }}>{subtitle}</motion.p>}
      {actions && <motion.div className="hero-actions no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9, duration: .7 }}>{actions}</motion.div>}
    </div>
    <div className="hero-bottom"><span>{eyebrow.split("—")[0].trim()}</span>{bottomHref ? <a href={bottomHref}>{bottom.toUpperCase()} <ArrowDown size={15} strokeWidth={1.5} /></a> : <span>{bottom.toUpperCase()}</span>}</div>
  </section>;
}

/** Encabezado de sección: "01 / PERFIL" con una línea fina. */
export function SectionHeading({ label }: { label: string }) {
  return <Reveal><div className="section-heading"><span className="eyebrow">{label}</span><span className="section-rule" /></div></Reveal>;
}

export { Magnetic };

/** Cambia el título de la pestaña del navegador. */
export function usePageTitle(title: string) {
  useEffect(() => { document.title = title; }, [title]);
}
