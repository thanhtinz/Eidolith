// World maps registry — World Part 8 §23.1 MVP map list (P0 maps ship in Phase 2).
export interface MapDef { id: string; nameVi: string; regionId: string; file: string; priority: "P0" | "P1"; }
export const MAPS: MapDef[] = [
  { id: "meadow_village", nameVi: "Meadow Village", regionId: "verdant_plains", file: "meadow_village.json", priority: "P0" },
  { id: "whispering_forest", nameVi: "Whispering Forest", regionId: "verdant_plains", file: "whispering_forest.json", priority: "P0" },
  { id: "ancient_grove", nameVi: "Ancient Grove", regionId: "verdant_plains", file: "ancient_grove.json", priority: "P1" },
  { id: "crystal_lake", nameVi: "Crystal Lake", regionId: "verdant_plains", file: "crystal_lake.json", priority: "P1" },
  { id: "windmill_fields", nameVi: "Windmill Fields", regionId: "verdant_plains", file: "windmill_fields.json", priority: "P1" },
  { id: "riverbend_village", nameVi: "Riverbend Village", regionId: "verdant_plains", file: "riverbend_village.json", priority: "P1" },
  { id: "lake_cave", nameVi: "Lake Cave", regionId: "verdant_plains", file: "lake_cave.json", priority: "P1" },
  { id: "forest_deep", nameVi: "Forest Deep", regionId: "verdant_plains", file: "forest_deep.json", priority: "P1" },
  { id: "grove_ruins", nameVi: "Grove Ruins", regionId: "verdant_plains", file: "grove_ruins.json", priority: "P1" },
  { id: "mist_marsh", nameVi: "Mist Marsh", regionId: "verdant_plains", file: "mist_marsh.json", priority: "P1" },
  { id: "hilltop_shrine", nameVi: "Hilltop Shrine", regionId: "verdant_plains", file: "hilltop_shrine.json", priority: "P1" },
  { id: "farm_acres", nameVi: "Farm Acres", regionId: "verdant_plains", file: "farm_acres.json", priority: "P1" },
  { id: "forest_camp", nameVi: "Forest Camp", regionId: "verdant_plains", file: "forest_camp.json", priority: "P1" },
  { id: "root_hollow_1", nameVi: "Root Hollow · Tầng 1", regionId: "verdant_plains", file: "root_hollow_1.json", priority: "P1" },
  { id: "root_hollow_2", nameVi: "Root Hollow · Tầng 2", regionId: "verdant_plains", file: "root_hollow_2.json", priority: "P1" },
];
export const mapById = (id: string) => MAPS.find(m => m.id === id);
