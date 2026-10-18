import { HighlightIcon, type HighlightIconKind } from "@/components/about/highlight-icon";
import type { NeonColor } from "@/lib/games";

interface Highlight {
  icon: HighlightIconKind;
  text: string;
  color: NeonColor;
}

const HIGHLIGHTS: Highlight[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

export function AboutHero() {
  return (
    <section className="about-hero">
      <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
      <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
      <p className="about-mission">
        ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
        los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
        y sin costo.
      </p>
      <div className="highlight-row">
        {HIGHLIGHTS.map(({ icon, text, color }) => (
          <div key={icon} className={`highlight ${color}`}>
            <HighlightIcon kind={icon} />
            <div className="hl-text pixel">{text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
