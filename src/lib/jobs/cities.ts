export interface CityDef {
  canonical: string;
  amharic: string;
  aliases: string[];
}

export const CITIES: CityDef[] = [
  {
    canonical: "Addis Ababa",
    amharic: "አዲስ አበባ",
    aliases: ["addis ababa", "addis", "አዲስ አበባ", "finfinne", "ፊንፊኔ"],
  },
  { canonical: "Adama", amharic: "አዳማ", aliases: ["adama", "nazret", "nazreth", "አዳማ", "ናዝሬት"] },
  { canonical: "Hawassa", amharic: "ሀዋሳ", aliases: ["hawassa", "awassa", "ሀዋሳ", "አዋሳ"] },
  { canonical: "Bahir Dar", amharic: "ባህር ዳር", aliases: ["bahir dar", "bahirdar", "ባህር ዳር"] },
  { canonical: "Mekelle", amharic: "መቀሌ", aliases: ["mekelle", "mekele", "መቀሌ"] },
  { canonical: "Dire Dawa", amharic: "ድሬዳዋ", aliases: ["dire dawa", "diredawa", "ድሬዳዋ", "ድሬ ዳዋ"] },
  { canonical: "Gondar", amharic: "ጎንደር", aliases: ["gondar", "gonder", "ጎንደር"] },
  { canonical: "Jimma", amharic: "ጅማ", aliases: ["jimma", "ጅማ"] },
  { canonical: "Harar", amharic: "ሐረር", aliases: ["harar", "ሐረር"] },
  { canonical: "Dessie", amharic: "ደሴ", aliases: ["dessie", "ደሴ"] },
];

const ALIASES = CITIES.flatMap((city) =>
  city.aliases.map((alias) => ({
    canonical: city.canonical,
    alias: alias.normalize("NFC").toLowerCase(),
  })),
).sort((a, b) => b.alias.length - a.alias.length);

export function detectCity(text: string | null | undefined): string | null {
  if (!text) return null;
  const haystack = text.normalize("NFC").toLowerCase();
  for (const { canonical, alias } of ALIASES) {
    if (/[\u1200-\u137F]/.test(alias) || alias.includes(" ")) {
      if (haystack.includes(alias)) return canonical;
      continue;
    }
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu").test(haystack)) {
      return canonical;
    }
  }
  return null;
}

export function cityAmharic(canonical: string | null | undefined): string | null {
  if (!canonical) return null;
  return CITIES.find((city) => city.canonical === canonical)?.amharic ?? canonical;
}
