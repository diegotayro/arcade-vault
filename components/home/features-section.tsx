import { FeatureIcon } from "@/components/home/feature-icon";
import { Reveal } from "@/components/home/reveal";
import { SectionHead } from "@/components/home/section-head";
import { FEATURES } from "@/lib/home";

const CARD_DELAY_MS = 80;

export function FeaturesSection() {
  return (
    <Reveal className="home-section">
      <SectionHead kicker="// 01" title="¿POR QUÉ ARCADE VAULT?" color="magenta" />
      <div className="feature-grid">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.icon}
            className={`feature-card ${feature.color}`}
            style={{ transitionDelay: `${index * CARD_DELAY_MS}ms` }}
          >
            <FeatureIcon kind={feature.icon} />
            <div className="ft-title pixel">{feature.title}</div>
            <div className="ft-desc">{feature.description}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
