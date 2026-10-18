import type { Metadata } from "next";
import { AboutHero } from "@/components/about/about-hero";
import { ContactSection } from "@/components/about/contact-section";
import { PixelDivider } from "@/components/about/pixel-divider";

export const metadata: Metadata = { title: "Sobre Nosotros" };

export default function AboutPage() {
  return (
    <div className="about fade-in">
      <AboutHero />
      <PixelDivider />
      <ContactSection />
    </div>
  );
}
