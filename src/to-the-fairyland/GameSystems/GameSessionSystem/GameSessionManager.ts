import {
    GameSessionState,
    GameSessionResumePoint,
    createInitialChapter1GameSessionState,
    createInitialChapter2GameSessionState,
    createInitialChapter3GameSessionState,
    createInitialChapter4GameSessionState
} from "./GameSessionState";
import type { CheckpointStoryKey } from "./LevelCheckpointMapping";
import { PlayerState } from "../PlayerSystem/PlayerState";
import { StoryState } from "../StorySystem/StoryState";
import { WorldState } from "../WorldSystem/WorldState";
import { CookieStorage } from "./CookieStorage";

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

    /**
     * Tracks which checkpoint keys have been organically captured during the current
     * play session. Persists across scene transitions (singleton lifetime). Cleared
     * when a new session starts. Prevents re-entry into the same room from
     * overwriting a checkpoint that was already correctly written this session.
     */
    private readonly checkpointsCapturedThisSession = new Set<CheckpointStoryKey>();

    private constructor() {
        this.currentSession = null;
    }

    /**
     * Returns the shared session manager.
     * On first access, automatically restores any saved session from cookies.
     * If no saved session exists, starts a new game.
     */
    public static getInstance(): GameSessionManager {
        if (!GameSessionManager.instance) {
            GameSessionManager.instance = new GameSessionManager();
            GameSessionManager.instance.restoreSessionFromCookie();
        }

        return GameSessionManager.instance;
    }

    /**
     * Starts a brand-new run with fresh player and story data.
     * Call this when the user presses "New Game".
     * Session is automatically persisted to cookies.
     */
    public startNewGame(): void {
        this.startNewChapter1Game();
    }

    public startNewChapter1Game(): void {
        this.currentSession = createInitialChapter1GameSessionState();
        this.checkpointsCapturedThisSession.clear();
    }
    
    public startNewChapter2Game(): void {
        this.currentSession = createInitialChapter2GameSessionState();
        this.checkpointsCapturedThisSession.clear();
    }

    public startNewChapter3Game(): void {
        this.currentSession = createInitialChapter3GameSessionState();
        this.checkpointsCapturedThisSession.clear();
    }

    public startNewChapter4Game(): void {
        this.currentSession = createInitialChapter4GameSessionState();
        this.checkpointsCapturedThisSession.clear();
    }
    

    /**
     * Replaces the current session with loaded data.
     * This is useful later for save/load support.
     * Session is automatically persisted to cookies.
     */
    public loadSession(session: GameSessionState): void {
        this.currentSession = session;
        this.checkpointsCapturedThisSession.clear();
    }

    public saveCurrentSession(): void {
        this.persistSessionToCookie();
    }

    public hasSavedSession(): boolean {
        return CookieStorage.loadManualSession() !== null;
    }

    /**
     * Saves a checkpoint snapshot, baking in an explicit resume point instead of
     * reading from session.resumePoint. This ensures manual saves (which mutate
     * session.resumePoint for their own position) never corrupt checkpoint data.
     * Also marks the key as captured this session so re-entering the room won't
     * overwrite it.
     */
    public saveCheckpointWithResumePoint(
        checkpointKey: CheckpointStoryKey,
        resumePoint: GameSessionResumePoint
    ): void {
        if (this.currentSession) {
            CookieStorage.saveCheckpoint(checkpointKey, this.currentSession, resumePoint);
            this.checkpointsCapturedThisSession.add(checkpointKey);
        }
    }

    /**
     * Returns true if this checkpoint has already been organically captured during
     * the current play session (persists across scene transitions).
     */
    public isCheckpointCapturedThisSession(checkpointKey: CheckpointStoryKey): boolean {
        return this.checkpointsCapturedThisSession.has(checkpointKey);
    }

    public loadCheckpoint(checkpointKey: CheckpointStoryKey): boolean {
        const checkpoint = CookieStorage.loadCheckpoint(checkpointKey);

        if (!checkpoint) {
            return false;
        }

        this.currentSession = checkpoint;
        this.checkpointsCapturedThisSession.clear();
        return true;
    }

    public hasCheckpoint(checkpointKey: CheckpointStoryKey): boolean {
        return CookieStorage.hasCheckpoint(checkpointKey);
    }

    public setActiveCheckpointKey(checkpointKey: CheckpointStoryKey): void {
        this.requireCurrentSession().activeCheckpointKey = checkpointKey;
    }

    public getActiveCheckpointKey(): CheckpointStoryKey | undefined {
        return this.currentSession?.activeCheckpointKey;
    }

    public setResumePoint(sceneId: string, spawnName?: string, cheatsEnabled?: boolean, playerPos?: { x: number; y: number }): void {
        const session = this.requireCurrentSession();
        session.resumePoint = {
            sceneId,
            spawnName,
            cheatsEnabled: cheatsEnabled ?? session.resumePoint.cheatsEnabled ?? false,
            playerPos
        };
    }

    public getResumePoint(): GameSessionState["resumePoint"] | null {
        return this.currentSession?.resumePoint ?? null;
    }

    /**
     * Clears the active session entirely.
     * Useful when quitting back to title or abandoning a run.
     * Removes session from cookies as well.
     */
    public clearSession(): void {
        this.currentSession = null;
        this.checkpointsCapturedThisSession.clear();
        CookieStorage.clearSession();
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

    /**
     * Attempts to restore the game session from cookies.
     * Called on initialization to support session persistence across page refreshes.
     * Returns true if a session was successfully restored.
     */
    public restoreSessionFromCookie(): boolean {
        try {
            const saved = CookieStorage.loadManualSession();
            if (saved && typeof saved === "object") {
                this.currentSession = saved;
                return true;
            }

            this.currentSession = null;
        } catch (error) {
            console.error("Failed to restore session from cookie:", error);
            this.currentSession = null;
        }
        return false;
    }

    /**
     * Persists the current session to cookies.
     * Called whenever the session is created or modified.
     */
    private persistSessionToCookie(): void {
        if (this.currentSession) {
            CookieStorage.saveManualSession(this.currentSession);
        }
    }
}