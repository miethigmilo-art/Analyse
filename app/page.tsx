import Hero from "@/components/ui/animated-shader-hero";

export default function Home() {
  return (
    <Hero
      trustBadge={{
        text: "Intelligent Trading. Fully Automated.",
        icons: ["⚡"],
      }}
      headline={{
        line1: "HELIX Trading",
        line2: "Intelligence",
      }}
      subtitle="8 autonomous strategies. Real-time signal scanning across 13 instruments. Risk-governed execution — 24/5."
      buttons={{
        primary: {
          text: "Open Dashboard",
        },
        secondary: {
          text: "View Strategies",
        },
      }}
    />
  );
}
