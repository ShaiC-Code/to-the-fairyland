import { GameSessionResumePoint, GameSessionState } from "./GameSessionState";
import type { CheckpointStoryKey } from "./LevelCheckpointMapping";
import Inventory from "../ItemSystem/Inventory";
import InventoryItem from "../ItemSystem/InventoryItem";
import FreshPrettyTooth from "../ItemSystem/Items/FreshPrettyTooth";
import FlowerRing from "../ItemSystem/Items/FlowerRing";
import LoftyBread from "../ItemSystem/Items/LoftyBread";
import SleepingBag from "../ItemSystem/Items/SleepingBag";
import ObsidianBoots from "../ItemSystem/Items/ObsidianBoots";
import WorldMap from "../ItemSystem/Items/WorldMap";
import FrozenBerries from "../ItemSystem/Items/FrozenBerries";
import CookedBerries from "../ItemSystem/Items/CookedBerries";
import Excalibur from "../ItemSystem/Items/Excalibur";

type StoredInventoryState = {
    capacity: number;
    items: string[];
};

type StoredPlayerState = {
    name: string;
    health: number;
    maxHealth: number;
    inventory: StoredInventoryState;
};

type StoredGameSessionState = {
    player: StoredPlayerState;
    story: GameSessionState["story"];
    world: GameSessionState["world"];
    resumePoint: GameSessionResumePoint;
    activeCheckpointKey?: CheckpointStoryKey;
};

/**
 * Utility for managing game session data in browser cookies.
 */
export class CookieStorage {
    private static readonly MANUAL_SESSION_COOKIE_NAME = "gameSessionManual";
    private static readonly CHECKPOINT_SLOT_COOKIE_PREFIX = "gameSessionCheckpoint:";
    private static readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

    private static checkpointSlotCookieName(checkpointKey: CheckpointStoryKey): string {
        return `${this.CHECKPOINT_SLOT_COOKIE_PREFIX}${checkpointKey}`;
    }

    private static setCookieItem(key: string, value: unknown): void {
        try {
            const jsonString = JSON.stringify(value);
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + this.COOKIE_MAX_AGE);

            document.cookie = `${key}=${encodeURIComponent(jsonString)}; path=/; expires=${expiryDate.toUTCString()}`;
        } catch (error) {
            console.error(`Failed to save to cookie: ${key}`, error);
        }
    }

    private static getCookieItem(key: string): unknown | null {
        try {
            const cookies = document.cookie.split("; ");
            for (const cookie of cookies) {
                const [cookieKey, cookieValue] = cookie.split("=");
                if (decodeURIComponent(cookieKey) === key) {
                    return JSON.parse(decodeURIComponent(cookieValue));
                }
            }
            return null;
        } catch (error) {
            console.error(`Failed to retrieve from cookie: ${key}`, error);
            return null;
        }
    }

    private static removeCookieItem(key: string): void {
        try {
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        } catch (error) {
            console.error(`Failed to delete cookie: ${key}`, error);
        }
    }

    /**
     * Saves data to a cookie as JSON.
     */
    public static setItem(key: string, value: unknown): void {
        try {
            this.setCookieItem(key, value);
        } catch (error) {
            console.error(`Failed to save to cookie: ${key}`, error);
        }
    }

    /**
     * Retrieves and parses data from a cookie.
     * Returns null if the cookie doesn't exist or parsing fails.
     */
    public static getItem(key: string): unknown | null {
        try {
            return this.getCookieItem(key);
        } catch (error) {
            console.error(`Failed to retrieve from cookie: ${key}`, error);
            return null;
        }
    }

    /**
     * Deletes a cookie.
     */
    public static removeItem(key: string): void {
        try {
            this.removeCookieItem(key);
        } catch (error) {
            console.error(`Failed to delete cookie: ${key}`, error);
        }
    }

    /**
     * Saves the game session to a cookie.
     */
    public static saveManualSession(session: GameSessionState): void {
        this.setItem(this.MANUAL_SESSION_COOKIE_NAME, this.serializeSession(session));
    }

    /**
     * Retrieves the saved game session from a cookie.
     */
    public static loadManualSession(): GameSessionState | null {
        const saved = this.getItem(this.MANUAL_SESSION_COOKIE_NAME);

        if (!saved || typeof saved !== "object") {
            return null;
        }

        return this.deserializeSession(saved as StoredGameSessionState);
    }

    /**
     * Clears the saved game session from cookies.
     */
    public static clearManualSession(): void {
        this.removeItem(this.MANUAL_SESSION_COOKIE_NAME);
    }

    /**
     * Saves a checkpoint snapshot for a specific level slot.
     * If resumePointOverride is provided it is baked into the snapshot instead of
     * session.resumePoint, so the live session is never mutated by a checkpoint write.
     */
    public static saveCheckpoint(
        checkpointKey: CheckpointStoryKey,
        session: GameSessionState,
        resumePointOverride?: GameSessionResumePoint
    ): void {
        const serialized = this.serializeSession(session);
        if (resumePointOverride !== undefined) {
            serialized.resumePoint = resumePointOverride;
        }

        this.setItem(this.checkpointSlotCookieName(checkpointKey), serialized);
    }

    public static loadCheckpoint(checkpointKey: CheckpointStoryKey): GameSessionState | null {
        const slotSaved = this.getItem(this.checkpointSlotCookieName(checkpointKey));
        if (slotSaved && typeof slotSaved === "object") {
            return this.deserializeSession(slotSaved as StoredGameSessionState);
        }

        return null;
    }

    public static hasCheckpoint(checkpointKey: CheckpointStoryKey): boolean {
        return this.getItem(this.checkpointSlotCookieName(checkpointKey)) !== null;
    }

    public static clearCheckpoint(checkpointKey: CheckpointStoryKey): void {
        this.removeItem(this.checkpointSlotCookieName(checkpointKey));
    }

    public static clearAllCheckpoints(): void {
        // Remove per-checkpoint cookies
        try {
            const cookies = document.cookie.split("; ");
            for (const cookie of cookies) {
                const [cookieKey] = cookie.split("=");
                if (!cookieKey) {
                    continue;
                }

                const decodedKey = decodeURIComponent(cookieKey);
                if (decodedKey.startsWith(this.CHECKPOINT_SLOT_COOKIE_PREFIX)) {
                    this.removeItem(decodedKey);
                }
            }
        } catch (error) {
            console.warn("Failed to clear checkpoint cookies (best-effort)", error);
        }
    }

    public static clearSession(): void {
        this.clearManualSession();
        this.clearAllCheckpoints();
    }

    private static serializeSession(session: GameSessionState): StoredGameSessionState {
        return {
            player: {
                name: session.player.name,
                health: session.player.health,
                maxHealth: session.player.maxHealth,
                inventory: {
                    capacity: session.player.inventory.capacity,
                    items: Array.from(session.player.inventory.items()).map(item => this.serializeInventoryItem(item))
                }
            },
            story: session.story,
            world: session.world,
            resumePoint: session.resumePoint,
            activeCheckpointKey: session.activeCheckpointKey
        };
    }

    private static deserializeSession(saved: StoredGameSessionState): GameSessionState | null {
        if (!saved.player || !saved.story || !saved.world) {
            return null;
        }

        const inventory = new Inventory(saved.player.inventory?.capacity ?? 10);
        for (const itemKey of saved.player.inventory?.items ?? []) {
            const item = this.deserializeInventoryItem(itemKey);
            if (item) {
                inventory.add(item);
            }
        }

        return {
            player: {
                name: saved.player.name,
                health: saved.player.health,
                maxHealth: saved.player.maxHealth,
                inventory
            },
            story: saved.story,
            world: saved.world,
            resumePoint: saved.resumePoint,
            activeCheckpointKey: saved.activeCheckpointKey
        };
    }

    private static serializeInventoryItem(item: InventoryItem): string {
        return item.constructor.name;
    }

    private static deserializeInventoryItem(itemKey: string): InventoryItem | null {
        switch (itemKey) {
            case "FreshPrettyTooth":
                return new FreshPrettyTooth();
            case "FlowerRing":
                return new FlowerRing();
            case "LoftyBread":
                return new LoftyBread();
            case "SleepingBag":
                return new SleepingBag();
            case "ObsidianBoots":
                return new ObsidianBoots();
            case "WorldMap":
                return new WorldMap();
            case "FrozenBerries":
                return new FrozenBerries();
            case "CookedBerries":
                return new CookedBerries();
            case "Excalibur":
                return new Excalibur();
            default:
                return null;
        }
    }
}