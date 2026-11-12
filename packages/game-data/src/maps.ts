// World maps registry — World Part 8 §23.1 MVP map list (P0 maps ship in Phase 2).
export interface MapDef { id: string; nameVi: string; regionId: string; file: string; priority: "P0" | "P1"; }
export const MAPS: MapDef[] = [
  { id: "meadow_village", nameVi: "Meadow Village", regionId: "verdant_plains", file: "meadow_village.json", priority: "P0" },
  { id: "whispering_forest", nameVi: "Whispering Forest", regionId: "verdant_plains", file: "whispering_forest.json", priority: "P0" },
  { id: "ancient_grove", nameVi: "Ancient Grove", regionId: "verdant_plains", file: "ancient_grove.json", priority: "P1" },
];
export const mapById = (id: string) => MAPS.find(m => m.id === id);
