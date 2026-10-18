import { Reveal } from "@/components/home/reveal";

const PIXEL_COUNT = 24;
const PIXEL_DELAY_MS = 80;

export function PixelDivider() {
  return (
    <Reveal className="about-divider" aria-hidden="true">
      <div className="div-bar" />
      <div className="div-pixels">
        {Array.from({ length: PIXEL_COUNT }, (_, index) => (
          <span key={index} style={{ animationDelay: `${index * PIXEL_DELAY_MS}ms` }} />
        ))}
      </div>
      <div className="div-bar" />
    </Reveal>
  );
}
