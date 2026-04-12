import EventQueue from "../Events/EventQueue";
import Input from "../Input/Input";
import InputHandler from "../Input/InputHandler";
import Recorder from "../Playback/EventRecorder";
import Debug from "../Debug/Debug";
import ResourceManager from "../ResourceManager/ResourceManager";
import Viewport from "../SceneGraph/Viewport";
import SceneManager from "../Scene/SceneManager";
import AudioManager from "../Sound/AudioManager";
import Stats from "../Debug/Stats";
import RenderingManager from "../Rendering/RenderingManager";
import CanvasRenderer from "../Rendering/CanvasRenderer";
import Color from "../Utils/Color";
import GameOptions from "./GameOptions";
import GameLoop from "./GameLoop";
import FixedUpdateGameLoop from "./FixedUpdateGameLoop";
import EnvironmentInitializer from "./EnvironmentInitializer";
import Vec2 from "../DataTypes/Vec2";
import RegistryManager from "../Registry/RegistryManager";
import WebGLRenderer from "../Rendering/WebGLRenderer";
import Scene from "../Scene/Scene";
import RecordingManager from "../Playback/PlaybackManager";
import InputReplayer from "../Playback/EventReplayer";
import { TimerState } from "../Timing/Timer";
import PlaybackManager from "../Playback/PlaybackManager";

/**
 * The main loop of the game engine.
 * Handles the update order, and initializes all subsystems.
 * The Game manages the update cycle, and requests animation frames to render to the browser.
 */
export default class Game {
    gameOptions: GameOptions;
    private showDebug: boolean;
    private showStats: boolean;

    // The game loop
    private loop: GameLoop;

    // Game canvas and its width and height
    readonly GAME_CANVAS: HTMLCanvasElement;
    readonly DEBUG_CANVAS: HTMLCanvasElement;
	readonly WIDTH: number;
    readonly HEIGHT: number;
    private viewport: Viewport;
    private ctx: CanvasRenderingContext2D | WebGLRenderingContext;
    private clearColor: Color;
    
    // All of the necessary subsystems that need to run here
	private eventQueue: EventQueue;
	private inputHandler: InputHandler;
	private playbackManager: PlaybackManager;
    private resourceManager: ResourceManager;
    private sceneManager: SceneManager;
    private audioManager: AudioManager;
    private renderingManager: RenderingManager;
    private transitionOverlay: HTMLDivElement | null;
    private loadingOverlay: HTMLDivElement | null;
    private loadingBarFill: HTMLDivElement | null;
    private loadingPercent: HTMLDivElement | null;
    private loadingOverlayTimer: number | null;
    private loadingOverlayReady: boolean;
    private latestLoadingProgress: number;
    private transitionOverlayFadeTimer: number | null;

    /**
     * Creates a new Game
     * @param options The options for Game initialization
     */
    constructor(options?: Record<string, any>){
        // Before anything else, build the environment
        EnvironmentInitializer.setup();

        // Typecast the config object to a GameConfig object
        this.gameOptions = GameOptions.parse(options);

        this.showDebug = this.gameOptions.showDebug;
        this.showStats = this.gameOptions.showStats;

        // Create an instance of a game loop
        this.loop = new FixedUpdateGameLoop();

        // Get the game canvas and give it a background color
        this.GAME_CANVAS = <HTMLCanvasElement>document.getElementById("game-canvas");
        this.DEBUG_CANVAS = <HTMLCanvasElement>document.getElementById("debug-canvas");
    
        // Give the canvas a size and get the rendering context
        this.WIDTH = this.gameOptions.canvasSize.x;
        this.HEIGHT = this.gameOptions.canvasSize.y;

        // This step MUST happen before the resource manager does anything
        if(this.gameOptions.useWebGL){
            this.renderingManager = new WebGLRenderer();
        } else {
            this.renderingManager = new CanvasRenderer();
        }
        this.initializeGameWindow();
        this.ctx = this.renderingManager.initializeCanvas(this.GAME_CANVAS, this.WIDTH, this.HEIGHT);
        this.clearColor = new Color(this.gameOptions.clearColor.r, this.gameOptions.clearColor.g, this.gameOptions.clearColor.b);

        // Initialize debugging and stats
        Debug.initializeDebugCanvas(this.DEBUG_CANVAS, this.WIDTH, this.HEIGHT);
        Stats.initStats();

        if(this.gameOptions.showStats) {
            // Find the stats output and make it no longer hidden
            document.getElementById("stats").hidden = false;
        }

        // Size the viewport to the game canvas
        const canvasSize = new Vec2(this.WIDTH, this.HEIGHT);
        this.viewport = new Viewport(canvasSize, this.gameOptions.zoomLevel);

        // Initialize all necessary game subsystems
        this.eventQueue = EventQueue.getInstance();
        this.inputHandler = new InputHandler(this.GAME_CANVAS);
        Input.initialize(this.viewport, this.gameOptions.inputs);
        this.resourceManager = ResourceManager.getInstance();
        this.sceneManager = new SceneManager(this.viewport, this.renderingManager);
        this.audioManager = AudioManager.getInstance();
        this.playbackManager = new PlaybackManager();

        this.transitionOverlay = document.getElementById("transition-overlay") as HTMLDivElement | null;
        this.loadingOverlay = document.getElementById("loading-overlay") as HTMLDivElement | null;
        this.loadingBarFill = document.getElementById("loading-bar-fill") as HTMLDivElement | null;
        this.loadingPercent = document.getElementById("loading-percent") as HTMLDivElement | null;
        this.loadingOverlayTimer = null;
        this.loadingOverlayReady = false;
        this.latestLoadingProgress = 0;
        this.transitionOverlayFadeTimer = null;
        this.bindLoadingOverlay();
        
    }

    private bindLoadingOverlay(): void {
        this.resourceManager.onLoadProgress = (progress: number) => {
            const clamped = Math.max(0, Math.min(1, progress));
            this.latestLoadingProgress = clamped;

            if (!this.resourceManager.loadingOverlayEnabled) {
                this.resetLoadingOverlayGate();
                this.hideLoadingOverlay();
            }

            this.showTransitionOverlay();

            if (!this.loadingOverlayReady) {
                this.armLoadingOverlayGate();
            }

            if (this.loadingOverlayReady) {
                this.showLoadingOverlay(clamped);
            }
        };

        this.resourceManager.onLoadComplete = () => {
            this.resetLoadingOverlayGate();
            this.hideLoadingOverlay();
            this.hideTransitionOverlay();
        };
    }

    private showTransitionOverlay(): void {
        if (!this.transitionOverlay || !this.resourceManager.transitionFadeEnabled) {
            return;
        }

        if (this.transitionOverlayFadeTimer !== null) {
            window.clearTimeout(this.transitionOverlayFadeTimer);
            this.transitionOverlayFadeTimer = null;
        }

        const fadeOutMs = Math.max(0, this.resourceManager.transitionFadeOutMs ?? 0);
        this.transitionOverlay.hidden = false;
        this.transitionOverlay.style.transition = `opacity ${fadeOutMs}ms linear`;
        // Force style application before driving the next opacity value.
        this.transitionOverlay.getBoundingClientRect();
        this.transitionOverlay.style.opacity = "1";
    }

    private hideTransitionOverlay(): void {
        if (!this.transitionOverlay) {
            return;
        }

        if (!this.resourceManager.transitionFadeEnabled) {
            this.transitionOverlay.hidden = true;
            this.transitionOverlay.style.opacity = "0";
            return;
        }

        if (this.transitionOverlayFadeTimer !== null) {
            window.clearTimeout(this.transitionOverlayFadeTimer);
            this.transitionOverlayFadeTimer = null;
        }

        const fadeInMs = Math.max(0, this.resourceManager.transitionFadeInMs ?? 0);
        this.transitionOverlay.style.transition = `opacity ${fadeInMs}ms linear`;
        this.transitionOverlay.style.opacity = "0";

        this.transitionOverlayFadeTimer = window.setTimeout(() => {
            this.transitionOverlayFadeTimer = null;
            if (this.transitionOverlay) {
                this.transitionOverlay.hidden = true;
            }
        }, fadeInMs);
    }

    private armLoadingOverlayGate(): void {
        if (this.loadingOverlayTimer !== null) {
            return;
        }

        const delayMs = Math.max(0, this.resourceManager.loadingOverlayDelayMs ?? 0);
        if (delayMs === 0) {
            this.loadingOverlayReady = true;
            this.showLoadingOverlay(this.latestLoadingProgress);
            return;
        }

        this.loadingOverlayTimer = window.setTimeout(() => {
            this.loadingOverlayTimer = null;
            this.loadingOverlayReady = true;
            this.showLoadingOverlay(this.latestLoadingProgress);
        }, delayMs);
    }

    private resetLoadingOverlayGate(): void {
        if (this.loadingOverlayTimer !== null) {
            window.clearTimeout(this.loadingOverlayTimer);
            this.loadingOverlayTimer = null;
        }

        this.loadingOverlayReady = false;
        this.latestLoadingProgress = 0;
    }

    private showLoadingOverlay(progress: number): void {
        if (this.loadingOverlay) {
            this.loadingOverlay.hidden = false;
        }

        const percent = Math.round(progress * 100);
        if (this.loadingBarFill) {
            this.loadingBarFill.style.width = `${percent}%`;
        }
        if (this.loadingPercent) {
            this.loadingPercent.textContent = `${percent}%`;
        }
    }

    private hideLoadingOverlay(): void {
        if (this.loadingOverlay) {
            this.loadingOverlay.hidden = true;
        }
    }

    /**
     * Set up the game window that holds the canvases
     */
    private initializeGameWindow(): void {
        const gameWindow = document.getElementById("game-window");
        
        // Set the height of the game window
        gameWindow.style.width = this.WIDTH + "px";
        gameWindow.style.height = this.HEIGHT + "px";
    }

    /**
     * Retreives the SceneManager from the Game
     * @returns The SceneManager
     */
    getSceneManager(): SceneManager {
        return this.sceneManager;
    }

    /**
     * Starts the game
     */
    start(InitialScene: new (...args: any) => Scene, options: Record<string, any>): void {
        // Set the update function of the loop
        this.loop.doUpdate = (deltaT: number) => this.update(deltaT);

        // Set the render function of the loop
        this.loop.doRender = () => this.render();

        // Preload registry items
        RegistryManager.preload();

        // Load the items with the resource manager
        this.resourceManager.loadResourcesFromQueue(() => {
            // When we're done loading, start the loop
            console.log("Finished Preload - loading first scene");
            this.sceneManager.changeToScene(InitialScene, {}, options);
            this.loop.start();
        });
    }

    /**
     * Updates all necessary subsystems of the game. Defers scene updates to the sceneManager
     * @param deltaT The time sine the last update
     */
    update(deltaT: number): void {
        try{
            // Handle all events that happened since the start of the last loop
            this.eventQueue.update(deltaT);

            // Update the input handler - disabling/enabling user input
            this.inputHandler.update(deltaT);

            // Update the input data structures so game objects can see the input
            Input.update(deltaT);

            // Update the recording of the game
            this.playbackManager.update(deltaT);

            // Update all scenes
            this.sceneManager.update(deltaT);

            // Update all sounds
            this.audioManager.update(deltaT);
            
            // Load or unload any resources if needed
            this.resourceManager.update(deltaT);
        } catch(e){
            this.loop.pause();
            console.warn("Uncaught Error in Update - Crashing gracefully");
            console.error(e);
        }
    }

    /**
     * Clears the canvas and defers scene rendering to the sceneManager. Renders the debug canvas
     */
    render(): void {
        try{
            // Clear the canvases
            Debug.clearCanvas();

            this.renderingManager.clear(this.clearColor);

            this.sceneManager.render();

            // Hacky debug mode
            if(Input.isKeyJustPressed("g")){
                this.showDebug = !this.showDebug;
            }

            // Debug render
            if(this.showDebug){
                Debug.render();
            }

            if(this.showStats){
                Stats.render();
            }
        } catch(e){
            this.loop.pause();
            console.warn("Uncaught Error in Render - Crashing gracefully");
            console.error(e);
        }
    }
}