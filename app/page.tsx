import type { Metadata } from "next";
import { ActivitySection } from "@/components/home/activity-section";
import { FeaturesSection } from "@/components/home/features-section";
import { FinalCta } from "@/components/home/final-cta";
import { GamesPreview } from "@/components/home/games-preview";
import { Hero } from "@/components/home/hero";
import { PricingSection } from "@/components/home/pricing-section";
import { StatsSection } from "@/components/home/stats-section";

export const metadata: Metadata = { title: "Inicio" };

export default function Home() {
  return (
    <div className="home fade-in">
      <Hero />
      <FeaturesSection />
      <GamesPreview />
      <StatsSection />
      <ActivitySection />
      <PricingSection />
      <FinalCta />
    </div>
  );
}
