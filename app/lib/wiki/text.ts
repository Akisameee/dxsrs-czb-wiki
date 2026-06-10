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

export function linkCharactersInText(text: string | null | undefined, enums: WikiEnums) {
  const source = text || "";
  if (!source) return [];

  const characters = Object.entries(enums.Character || {})
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([id, label]) => ({ id: Number(id), label }))
    .filter((item) => Number.isFinite(item.id) && item.label.length > 1)
    .sort((a, b) => b.label.length - a.label.length || a.id - b.id);

  const parts: WikiTextPart[] = [];
  let pending = "";
  let index = 0;

  while (index < source.length) {
    const match = characters.find((item) => source.startsWith(item.label, index));
    if (!match) {
      pending += source[index];
      index += 1;
      continue;
    }

    if (pending) {
      parts.push(wikiText(pending));
      pending = "";
    }
    parts.push(wikiCharacter(match.id, match.label));
    index += match.label.length;
  }

  if (pending) parts.push(wikiText(pending));
  return parts;
}
