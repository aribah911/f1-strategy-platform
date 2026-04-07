import { RegulationBucket, Season } from "@/types/prediction";

export function getRegulationBucket(season: Season): RegulationBucket {
  if (season >= 2026) {
    return "REG_2026_PLUS";
  }

  return "REG_2023_2025";
}