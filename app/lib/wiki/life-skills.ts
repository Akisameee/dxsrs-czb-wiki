export type LifeSkillType = "mining" | "herbGathering" | "hunting" | "forging" | "alchemy" | "sewing";
export type LifeSkillIconSize = "sm" | "md" | "lg";
export type LifeSkillIconSizeValue = LifeSkillIconSize | number;

export const lifeSkillIconSizes: Record<LifeSkillIconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const lifeSkillImageIds: Record<LifeSkillType, string[]> = {
  mining: [
    "sharedassets1.assets:133",
    "sharedassets1.assets:89",
    "sharedassets1.assets:70",
    "sharedassets1.assets:28",
    "sharedassets1.assets:43",
    "sharedassets1.assets:198",
  ],
  herbGathering: [
    "sharedassets1.assets:46",
    "sharedassets1.assets:72",
    "sharedassets1.assets:178",
    "sharedassets1.assets:95",
    "sharedassets1.assets:194",
    "sharedassets1.assets:91",
  ],
  hunting: [
    "sharedassets1.assets:100",
    "sharedassets1.assets:104",
    "sharedassets1.assets:17",
    "sharedassets1.assets:65",
    "sharedassets1.assets:50",
    "sharedassets1.assets:208",
  ],
  forging: [
    "sharedassets1.assets:42",
    "sharedassets1.assets:117",
    "sharedassets1.assets:86",
    "sharedassets1.assets:212",
    "sharedassets1.assets:203",
    "sharedassets1.assets:166",
  ],
  alchemy: [
    "sharedassets1.assets:48",
    "sharedassets1.assets:214",
    "sharedassets1.assets:77",
    "sharedassets1.assets:123",
    "sharedassets1.assets:145",
    "sharedassets1.assets:51",
  ],
  sewing: [
    "sharedassets1.assets:202",
    "sharedassets1.assets:92",
    "sharedassets1.assets:88",
    "sharedassets1.assets:66",
    "sharedassets1.assets:15",
    "sharedassets1.assets:162",
  ],
};

export function lifeSkillLevel(value: number | string | null | undefined) {
  return Math.max(0, Math.min(5, Math.floor(Number(value) || 0)));
}

export function lifeSkillImageId(type: LifeSkillType, value: number | string | null | undefined, index: number) {
  const imageIds = lifeSkillImageIds[type] || [];
  const level = lifeSkillLevel(value);
  return imageIds[index <= level ? index : 0] || imageIds[0] || null;
}

export function lifeSkillIconSize(value: LifeSkillIconSizeValue | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return lifeSkillIconSizes[value || "md"] || lifeSkillIconSizes.md;
}

export function lifeSkillIconSizeKey(value: LifeSkillIconSizeValue | null | undefined): LifeSkillIconSize {
  return typeof value === "string" && value in lifeSkillIconSizes ? value : "md";
}
