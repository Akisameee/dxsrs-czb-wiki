import type { BgDatabaseTable } from "../bgdatabase";
import { saveEditCharacterName, type SaveEditDraft, type SaveEditFile } from "./model";
import type { SaveEditWorkspaceItemView } from "./workspace";

export type SaveEditMainPageTableSet = {
  injuryTable: BgDatabaseTable | null;
  inventoryTable: BgDatabaseTable | null;
  jsWugongTable: BgDatabaseTable | null;
  gWugongTable: BgDatabaseTable | null;
  gWugongDetailTable: BgDatabaseTable | null;
  npcTable: BgDatabaseTable | null;
  easyTables: BgDatabaseTable[];
};

export type SaveEditMainPageView = {
  item: SaveEditWorkspaceItemView;
  save: SaveEditFile;
  currentSave: SaveEditFile;
  draft: SaveEditDraft;
  fileName: string;
  characterName: string;
  selectedTableIndex: number;
  tables: SaveEditMainPageTableSet;
};

export function createSaveEditMainPageView(
  item: SaveEditWorkspaceItemView,
  easyTableNames: string[],
): SaveEditMainPageView | null {
  if (item.save?.kind !== "bgdatabase") return null;
  if (item.currentSave?.kind !== "bgdatabase") return null;

  const save = item.save;
  const currentSave = item.currentSave;
  const draft = item.draft;
  const findTable = (name: string) => currentSave.tables.find((table) => table.name === name) || null;
  const easyTables = easyTableNames
    .map((name) => findTable(name))
    .filter((table): table is BgDatabaseTable => Boolean(table && table.rowCount <= 1));

  return {
    item,
    save,
    currentSave,
    draft,
    fileName: item.fileName,
    characterName: saveEditCharacterName(currentSave, draft),
    selectedTableIndex: item.selectedTableIndex,
    tables: {
      injuryTable: findTable("ShangBing"),
      inventoryTable: findTable("XingNang"),
      jsWugongTable: findTable("JSWugong"),
      gWugongTable: findTable("GWuGong"),
      gWugongDetailTable: findTable("GWuGongDetail"),
      npcTable: findTable("Npc"),
      easyTables,
    },
  };
}
