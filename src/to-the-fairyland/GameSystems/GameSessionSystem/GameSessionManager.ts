import {
    GameSessionState,
    createInitialChapter1GameSessionState,
    createInitialChapter2GameSessionState,
    createInitialChapter4GameSessionState
} from "./GameSessionState";
import { PlayerState } from "../PlayerSystem/PlayerState";
import { StoryState } from "../StorySystem/StoryState";
import { WorldState } from "../WorldSystem/WorldState";

/**
 * Owns the live game session for the current run.
 * This is the single source of truth for cross-scene persistent data.
 *
 * Important:
 * - This class should manage session lifecycle only.
 * - Story rules still belong in StoryManager.
 * - Player-specific helpers can still live in PlayerStateManager if you keep it.
 */
export default class GameSessionManager {
    /** Shared singleton instance used by all scenes and managers. */
    private static instance: GameSessionManager | null = null;

    /**
     * The currently active play session.
     * Null means a run has not started yet, or the session was cleared.
     */
    private currentSession: GameSessionState | null;

    private constructor() {
        this.currentSession = null;
    }

    /**
     * Returns the shared session manager.
     */
    public static getInstance(): GameSessionManager {
        if (!GameSessionManager.instance) {
            GameSessionManager.instance = new GameSessionManager();
        }

        return GameSessionManager.instance;
    }

    /**
     * Starts a brand-new run with fresh player and story data.
     * Call this when the user presses "New Game".
     */
    public startNewGame(): void {
        this.startNewChapter1Game();
    }

    public startNewChapter1Game(): void {
        this.currentSession = createInitialChapter1GameSessionState();
    }
    
    public startNewChapter2Game(): void {
        this.currentSession = createInitialChapter2GameSessionState();
    }

    public startNewChapter4Game(): void {
        this.currentSession = createInitialChapter4GameSessionState();
    }

    /**
     * Replaces the current session with loaded data.
     * This is useful later for save/load support.
     */
    public loadSession(session: GameSessionState): void {
        this.currentSession = session;
    }

    /**
     * Clears the active session entirely.
     * Useful when quitting back to title or abandoning a run.
     */
    public clearSession(): void {
        this.currentSession = null;
    }

    /**
     * Returns true if a session is currently active.
     */
    public hasActiveSession(): boolean {
        return this.currentSession !== null;
    }

    /**
     * Returns the active session if one exists.
     * Use this when the caller wants to handle the "no active session" case itself.
     */
    public getCurrentSession(): GameSessionState | null {
        return this.currentSession;
    }

    /**
     * Returns the active session and throws if none exists.
     * Use this in gameplay code where a session must already have been created.
     */
    public requireCurrentSession(): GameSessionState {
        if (!this.currentSession) {
            throw new Error("No active game session. Call startNewGame() before entering gameplay scenes.");
        }

        return this.currentSession;
    }

    /**
     * Accessor for the State if the Player.
     */
    public getPlayerState(): PlayerState {
        return this.requireCurrentSession().player;
    }

    /**
     * Accessor for the State of the Story.
     */
    public getStoryState(): StoryState {
        return this.requireCurrentSession().story;
    }

    /**
     * Accessor for the State of the world.
     */
    public getWorldState(): WorldState {
        return this.requireCurrentSession().world;
    }
}