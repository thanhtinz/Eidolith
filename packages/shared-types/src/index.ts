// Shared API types — EIDOLITH API Part 6 §2 (standard envelope) and §3-4 (auth/player).
export interface ApiMeta { requestId: string; timestamp: string; }
export interface ApiError { code: string; message: string; details?: Record<string, unknown>; }
export interface ApiSuccess<T> { success: true; data: T; error: null; meta: ApiMeta; }
export interface ApiFailure { success: false; data: null; error: ApiError; meta: ApiMeta; }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface RegisterRequest { email: string; username?: string; password: string; }
export interface CharacterCreateRequest {
  displayName: string; avatarId: string; hairStyle: string; hairColor: string; outfit: string;
}
export interface RegisterResponse { userId: string; emailVerificationRequired: boolean; }
export interface LoginRequest { email: string; password: string; deviceId?: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; expiresIn: number; }
export interface LoginResponse extends AuthTokens { user: { id: string; username: string }; }
export interface RefreshRequest { refreshToken: string; }

export interface PlayerProfile {
  playerId: string; displayName: string; level: number; experience: number;
  avatarId: string; currentRegion: string; currentMap: string;
  characterCreated: boolean; hairStyle?: string; hairColor?: string; outfit?: string;
}
export interface PlayerWallet {
  gold: number; crystal: number; bondEssence: number; evolutionCore: number;
  researchData: number;
}
export interface WildSpawnInfo {
  spawnId: string; creatureId: string; level: number; x: number; y: number;
}
export interface OwnedCreature {
  instanceId: string; creatureId: string; name: string; level: number;
  rarity: Rarity; element: string; role: string; acquiredMethod: string; acquiredAt: string;
  experience: number; bondLevel: number;
}
export interface InventoryStack {
  itemId: string; name: string; category: string; rarity: string; description: string; quantity: number;
}
export interface SummonResultItem {
  creatureId: string; rarity: Rarity; isDuplicate: boolean; creatureInstanceId: string | null; shardsGained: number;
}
export interface SummonPullResponse {
  results: SummonResultItem[];
  pity: { sinceRare: number; sinceEpic: number; guaranteeRareAt: number; guaranteeEpicAt: number };
  remainingCrystal: number;
}
export interface PlayerProgress {
  mainStoryStage: string; tutorialCompleted: boolean;
  unlockedRegions: string[]; unlockedFeatures: string[];
}
export interface PlayerStatistics {
  totalPlaytimeSeconds: number; totalBattles: number; wins: number; losses: number;
  capturedEidolons: number; summonedEidolons: number; evolutionCount: number; dungeonCompletions: number;
}
export type ElementType = "Flame"|"Tide"|"Grove"|"Stone"|"Gale"|"Frost"|"Volt"|"Venom"|"Shade"|"Astral";
export type Rarity = "Common"|"Uncommon"|"Rare"|"Epic"|"Legendary";
export type CombatRole = "Guardian"|"Striker"|"Ranger"|"Support"|"Controller"|"Specialist";

/* --- Combat (Phase 4) --- */
export interface BattleTeamUnit {
  unitId: string; team: 0 | 1; creatureId: string; name: string;
  element: string; role: string; level: number; maxHp: number;
}
export interface BattleEventData { tick: number; type: string; data: Record<string, unknown>; }
export interface BattleResponse {
  battleId: string; seed: number; winner: 0 | 1 | 2; ticks: number; hash: string;
  teams: BattleTeamUnit[]; events: BattleEventData[];
  rewards?: BattleRewards;
}
/** Phase 5: what a finished battle granted (server-applied). */
export interface BattleRewards {
  creatureXp: number;
  levelUps: { instanceId: string; creatureId: string; level: number }[];
  playerXp: number; playerLevel: number; playerLeveledUp: boolean;
  gold: number; evolutionCore: number;
}
export interface QuestView {
  key: string; scope: "arc" | "daily"; title: string; target: number; progress: number;
  complete: boolean; claimed: boolean;
  rewards: { currency: string; amount: number }[];
}
export interface SideQuestView {
  key: string; title: string; npcName: string; npcRole: string;
  giverText: string; progressText: string;
  target: number; progress: number;
  state: "available" | "active" | "complete" | "claimed";
  rewards: { currency: string; amount: number }[];
}
export interface QuestStateResponse { day: string; arc: QuestView[]; daily: QuestView[]; side: SideQuestView[]; }
/** Sanctuary (Part 6 §13; redesign v2 phase 1 — docs/SANCTUARY-REDESIGN-v2.md).
 *  Accrued amounts are whole units ready to collect; rates/caps live
 *  server-side. progress01/nextUnitInSec/capInSec describe the lazy accrual
 *  of one assignment against the Sanctuary-Hall-level cap. */
export interface SanctuaryAssignmentView {
  instanceId: string; creatureId: string; level: number; accrued: number;
  progress01: number; nextUnitInSec: number; capInSec: number; synergy: boolean;
}
export interface SanctuaryUpgradeView {
  toLevel: number; gold: number; data: number; blockedByHall: boolean;
}
export interface SanctuaryBuildingView {
  id: string; nameVi: string; descVi: string; level: number;
  kind: "bond" | "xp" | "data" | "info" | "locked" | "expedition" | "workshop" | "shrine"; slots: number;
  perMinute: number; synergyElements: string[]; synergyRoles: string[];
  upgrade: SanctuaryUpgradeView | null;
  assignments: SanctuaryAssignmentView[];
}
export interface SanctuaryStateResponse {
  buildings: SanctuaryBuildingView[];
  hallLevel: number; capHours: number;
  totals: { bond: number; xp: number; data: number };
  researchData: number;
}
/** Sanctuary wave 2 — Expedition Gate (Part 2 §28) and Workshop. */
export interface ExpeditionDestinationView {
  id: string; nameVi: string; minutes: number; requiresText: string; rewardText: string;
  needElement: string | null; minTotalLevel: number | null;
}
export interface ExpeditionView {
  id: string; destinationId: string; nameVi: string;
  creatureIds: string[]; creatureNames: string[];
  startedAt: string; endsAt: string; ready: boolean;
  rewards: { currency: string; amount: number }[] | null;
}
export interface ExpeditionsResponse {
  destinations: ExpeditionDestinationView[]; active: ExpeditionView[];
}
export interface WorkshopRecipeView {
  id: string; nameVi: string; qty: number;
  costs: { currency: string; amount: number }[]; canAfford: boolean;
}
export interface WorkshopResponse { recipes: WorkshopRecipeView[]; }
/** Phase 6 wave 1 — friends (Part 12 MVP). */
export interface FriendView {
  playerId: string; displayName: string; level: number; avatarId: string; online: boolean;
  /** Companion-card extras (friends list only): team preview + current map. */
  team?: { creatureId: string; level: number }[];
  mapId?: string | null;
}
export interface FriendRequestView extends FriendView { requestId: string; }
export interface FriendsResponse {
  friends: FriendView[]; incoming: FriendRequestView[]; outgoing: FriendRequestView[];
}
export interface PlayerSearchResult extends FriendView {
  relation: "none" | "friend" | "outgoing" | "incoming";
}
