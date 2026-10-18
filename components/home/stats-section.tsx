import { Reveal } from "@/components/home/reveal";
import { STATS } from "@/lib/home";

const BLOCK_DELAY_MS = 90;

export function StatsSection() {
  return (
    <Reveal className="home-stats">
      <div className="stats-inner">
        {STATS.map((stat, index) => (
          <div
            key={stat.unit}
            className="stat-block"
            style={{ transitionDelay: `${index * BLOCK_DELAY_MS}ms` }}
          >
            <div className="stat-n neon-yellow">{stat.value}</div>
            <div className="stat-u pixel">{stat.unit}</div>
            <div className="stat-s">{stat.caption}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
