export type RarityTone = "gray" | "green" | "blue" | "purple" | "gold" | "red";

export const rarityToneById: Record<number, RarityTone> = {
  0: "gray",
  1: "green",
  2: "blue",
  3: "purple",
  4: "gold",
  5: "red",
};

export const rarityColors: Record<RarityTone, {
  card: string;
  badge: string;
  text: string;
}> = {
  gray: {
    card: "bg-[#f1f3f5] ring-[#aeb7c2] dark:bg-slate-950/30 dark:ring-slate-700",
    badge: "bg-[#edf1f5] text-[#687386] border-transparent",
    text: "text-[#4f5b68]",
  },
  green: {
    card: "bg-[#f4fbf6] ring-[#9bc8ac] dark:bg-emerald-950/30 dark:ring-emerald-900",
    badge: "bg-[#e2f4e7] text-[#217247] border-transparent",
    text: "text-[#217247]",
  },
  blue: {
    card: "bg-[#f3f8fd] ring-[#98bfe4] dark:bg-sky-950/30 dark:ring-sky-900",
    badge: "bg-[#e0effb] text-[#236aa2] border-transparent",
    text: "text-[#236aa2]",
  },
  purple: {
    card: "bg-[#faf6ff] ring-[#bea5dc] dark:bg-purple-950/30 dark:ring-purple-900",
    badge: "bg-[#efe5fb] text-[#6e3aa0] border-transparent",
    text: "text-[#6e3aa0]",
  },
  gold: {
    card: "bg-[#fff9e8] ring-[#d8b763] dark:bg-amber-950/30 dark:ring-amber-900",
    badge: "bg-[#f8e7b1] text-[#8a6512] border-transparent",
    text: "text-[#8a6512]",
  },
  red: {
    card: "bg-[#fff5f5] ring-[#e7a3a0] dark:bg-red-950/30 dark:ring-red-900",
    badge: "bg-[#f9d5d3] text-[#a22b28] border-transparent",
    text: "text-[#a22b28]",
  },
};

export function rarityTone(id: number | string | null | undefined) {
  return rarityToneById[Number(id)] || "gray";
}

export function rarityCardClass(id: number | string | null | undefined) {
  return rarityColors[rarityTone(id)].card;
}

export function rarityBadgeClass(id: number | string | null | undefined) {
  return rarityColors[rarityTone(id)].badge;
}

export function rarityTextClass(id: number | string | null | undefined) {
  return rarityColors[rarityTone(id)].text;
}
