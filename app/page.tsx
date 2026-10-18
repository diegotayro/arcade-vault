import { ActivitySection } from "@/components/home/activity-section";
import { FeaturesSection } from "@/components/home/features-section";
import { GamesPreview } from "@/components/home/games-preview";
import { Hero } from "@/components/home/hero";
import { StatsSection } from "@/components/home/stats-section";

export default function Home() {
  return (
    <div className="home fade-in">
      <Hero />
      <FeaturesSection />
      <GamesPreview />
      <StatsSection />
      <ActivitySection />
    </div>
  );
}
