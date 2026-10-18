import type { Metadata } from "next";
import { Courier_Prime, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Arcade Vault", template: "%s · Arcade Vault" },
  description: "Online games platform where players compete for the highest score",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${jetbrainsMono.variable} ${courierPrime.variable}`}
    >
      <body>
        <div className="av-bg" />
        <div className="av-noise" />
        <div id="root">
          <Suspense fallback={null}>
            <Nav />
          </Suspense>
          <main className="av-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
