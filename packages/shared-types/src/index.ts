// Shared API types — EIDOLITH API Part 6 §2 (standard envelope) and §3-4 (auth/player).
export interface ApiMeta { requestId: string; timestamp: string; }
export interface ApiError { code: string; message: string; details?: Record<string, unknown>; }
export interface ApiSuccess<T> { success: true; data: T; error: null; meta: ApiMeta; }
export interface ApiFailure { success: false; data: null; error: ApiError; meta: ApiMeta; }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface RegisterRequest { email: string; username: string; password: string; }
export interface RegisterResponse { userId: string; emailVerificationRequired: boolean; }
export interface LoginRequest { email: string; password: string; deviceId?: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; expiresIn: number; }
export interface LoginResponse extends AuthTokens { user: { id: string; username: string }; }
export interface RefreshRequest { refreshToken: string; }

export interface PlayerProfile {
  playerId: string; displayName: string; level: number; experience: number;
  avatarId: string; currentRegion: string; currentMap: string;
}
export interface PlayerWallet {
  gold: number; crystal: number; bondEssence: number; evolutionCore: number;
}
export interface WildSpawnInfo {
  spawnId: string; creatureId: string; level: number; x: number; y: number;
}
export interface OwnedCreature {
  instanceId: string; creatureId: string; name: string; level: number;
  rarity: Rarity; element: string; role: string; acquiredMethod: string; acquiredAt: string;
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
