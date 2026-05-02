import { GameSessionResumePoint, GameSessionState } from "./GameSessionState";
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

/**
 * Utility for managing game session data in browser cookies.
 */
export class CookieStorage {
    private static readonly SESSION_COOKIE_NAME = "gameSession";
    private static readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

    /**
     * Saves data to a cookie as JSON.
     */
    public static setItem(key: string, value: unknown): void {
        try {
            const jsonString = JSON.stringify(value);
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + this.COOKIE_MAX_AGE);
            
            document.cookie = `${key}=${encodeURIComponent(jsonString)}; path=/; expires=${expiryDate.toUTCString()}`;
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

    /**
     * Deletes a cookie.
     */
    public static removeItem(key: string): void {
        try {
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        } catch (error) {
            console.error(`Failed to delete cookie: ${key}`, error);
        }
    }

    /**
     * Saves the game session to a cookie.
     */
    public static saveSession(session: GameSessionState): void {
        this.setItem(this.SESSION_COOKIE_NAME, this.serializeSession(session));
    }

    /**
     * Retrieves the saved game session from a cookie.
     */
    public static loadSession(): GameSessionState | null {
        const saved = this.getItem(this.SESSION_COOKIE_NAME);

        if (!saved || typeof saved !== "object") {
            return null;
        }

        return this.deserializeSession(saved as StoredGameSessionState);
    }

    /**
     * Clears the saved game session from cookies.
     */
    public static clearSession(): void {
        this.removeItem(this.SESSION_COOKIE_NAME);
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
            resumePoint: session.resumePoint
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
            resumePoint: saved.resumePoint ?? {
                sceneId: saved.story.activeChapter === "CHAPTER2" ? "VillageScene" : "ShelterScene",
                spawnName: saved.story.activeChapter === "CHAPTER2" ? "RoadStart" : "SideOfBed",
                cheatsEnabled: false,
                playerPos: undefined
            }
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
            default:
                return null;
        }
    }
}

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
};
