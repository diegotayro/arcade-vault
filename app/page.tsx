import { FeaturesSection } from "@/components/home/features-section";
import { GamesPreview } from "@/components/home/games-preview";
import { Hero } from "@/components/home/hero";

export default function Home() {
  return (
    <div className="home fade-in">
      <Hero />
      <FeaturesSection />
      <GamesPreview />
    </div>
  );
}
