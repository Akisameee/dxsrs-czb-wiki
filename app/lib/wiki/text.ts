export type WikiEnums = Record<string, Record<string, string | null>>;

export type WikiTextPart =
  | { type: "text"; text: string }
  | { type: "character"; id: number; text: string }
  | { type: "item"; id: number; text: string };

export function wikiText(text: string): WikiTextPart {
  return { type: "text", text };
}

export function wikiCharacter(id: number, text: string): WikiTextPart {
  return { type: "character", id, text };
}

export function wikiItem(id: number, text: string): WikiTextPart {
  return { type: "item", id, text };
}

export function wikiPartsToText(parts: WikiTextPart[]) {
  return parts.map((part) => part.text).join("");
}

export function joinWikiPartGroups(groups: WikiTextPart[][], separator: string) {
  return groups.flatMap((group, index) => (index === 0 ? group : [wikiText(separator), ...group]));
}
