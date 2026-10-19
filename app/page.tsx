import type { Metadata } from "next";
import { Suspense } from "react";
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
      <Suspense fallback={<section className="home-section" aria-busy="true" />}>
        <GamesPreview />
      </Suspense>
      <StatsSection />
      <ActivitySection />
      <PricingSection />
      <FinalCta />
    </div>
  );
}
