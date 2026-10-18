"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const CREDITS_LABEL = "CRÉDITOS · 03";

function isLibraryPath(pathname: string) {
  return pathname.startsWith("/games");
}

export function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const homeClass = pathname === "/" ? "active" : "";
  const libraryClass = isLibraryPath(pathname) ? "active" : "";
  const hallOfFameClass = pathname === "/hall-of-fame" ? "active" : "";
  const aboutClass = pathname === "/about" ? "active" : "";
  const authClass =pathname === "/auth" ? "active" : "";
  const closePanel = () => setIsOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={closePanel}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={homeClass}>Inicio</Link>
          <Link href="/games" className={libraryClass}>Biblioteca</Link>
          <Link href="/hall-of-fame" className={hallOfFameClass}>Salón de la Fama</Link>
          <Link href="/about" className={aboutClass}>Sobre Nosotros</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>{CREDITS_LABEL}</span>
        </div>
        <Link href="/auth" className="btn auth-btn">Iniciar Sesión</Link>
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setIsOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (isOpen ? " open" : "")} onClick={closePanel}></div>
      <aside className={"av-mobile-panel" + (isOpen ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/" className={homeClass} onClick={closePanel}>Inicio</Link>
        <Link href="/games" className={libraryClass} onClick={closePanel}>Biblioteca</Link>
        <Link href="/hall-of-fame" className={hallOfFameClass} onClick={closePanel}>Salón de la Fama</Link>
        <Link href="/about" className={aboutClass} onClick={closePanel}>Sobre Nosotros</Link>
        <Link href="/auth" className={authClass} onClick={closePanel}>Iniciar Sesión</Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          {CREDITS_LABEL}
        </div>
      </aside>
    </>
  );
}
