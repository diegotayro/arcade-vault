import Link from "next/link";
import { Reveal } from "@/components/home/reveal";
import { SectionHead } from "@/components/home/section-head";

const PLAN_BENEFITS = [
  "Acceso a todos los juegos",
  "Ranking global y salón de la fama",
  "Sin anuncios entre partidas",
  "Guarda tus puntuaciones",
  "Nuevos juegos cada mes",
  "Funciona en cualquier navegador",
];

const FAQ_ITEMS = [
  {
    question: "¿REALMENTE ES GRATIS?",
    answer: 'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    question: "¿NECESITO CREAR CUENTA?",
    answer: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    question: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    answer: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];

function PriceCard() {
  return (
    <div className="price-card">
      <div className="pc-label pixel">PLAN ÚNICO</div>
      <div className="pc-name pixel">JUGADOR VAULT</div>
      <div className="pc-amount">
        <span className="pc-amount-n">$0</span>
        <span className="pc-amount-u">/ SIEMPRE</span>
      </div>
      <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
      <ul className="pc-list">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit}>✔ {benefit}</li>
        ))}
      </ul>
      <Link href="/auth" className="btn xl pulse" style={{ width: "100%" }}>EMPEZAR GRATIS →</Link>
      <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
      <div className="pc-stamp pixel">FREE<br />PLAY</div>
    </div>
  );
}

function PricingFaq() {
  return (
    <div className="pricing-faq">
      {FAQ_ITEMS.map((item) => (
        <div key={item.question} className="faq-item">
          <div className="faq-q pixel">{item.question}</div>
          <div className="faq-a">{item.answer}</div>
        </div>
      ))}
    </div>
  );
}

export function PricingSection() {
  return (
    <Reveal className="home-section">
      <SectionHead kicker="// 04" title="PRECIOS" color="green" />
      <div className="pricing-grid">
        <PriceCard />
        <PricingFaq />
      </div>
    </Reveal>
  );
}
