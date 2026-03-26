/**
 * Territory hero image mapping — maps each skill category to its cinematic background.
 */
import territoryTechnical from "@/assets/territory-technical.jpg";
import territoryAnalytical from "@/assets/territory-analytical.jpg";
import territoryStrategic from "@/assets/territory-strategic.jpg";
import territoryCreative from "@/assets/territory-creative.jpg";
import territoryCommunication from "@/assets/territory-communication.jpg";
import territoryLeadership from "@/assets/territory-leadership.jpg";
import territoryEthics from "@/assets/territory-ethics.jpg";
import territoryHumanEdge from "@/assets/territory-human-edge.jpg";

export const TERRITORY_HERO_IMAGES: Record<string, string> = {
  "Technical": territoryTechnical,
  "Analytical": territoryAnalytical,
  "Strategic": territoryStrategic,
  "Creative": territoryCreative,
  "Communication": territoryCommunication,
  "Leadership": territoryLeadership,
  "Ethics & Compliance": territoryEthics,
  "Human Edge": territoryHumanEdge,
};

/** Get hero image for a category, with fallback */
export function getTerritoryHeroImage(category: string): string | null {
  return TERRITORY_HERO_IMAGES[category] ?? null;
}
