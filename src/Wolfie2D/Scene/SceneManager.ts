import Scene from "./Scene";
import ResourceManager from "../ResourceManager/ResourceManager";
import Viewport from "../SceneGraph/Viewport";
import RenderingManager from "../Rendering/RenderingManager";
import MemoryUtils from "../Utils/MemoryUtils";
import Receiver from "../Events/Receiver";
import { GameEventType } from "../Events/GameEventType";

type SceneTransitionOptions = {
	showLoadingOverlay?: boolean;
	loadingOverlayDelayMs?: number;
	loadingOverlayMinVisibleMs?: number;
	useFadeTransition?: boolean;
	fadeOutMs?: number;
	fadeInMs?: number;
	pauseDuringFadeOut?: boolean;
};

/**
 * The SceneManager acts as an interface to create Scenes, and handles the lifecycle methods of Scenes.
 * It gives Scenes access to information they need from the @reference[Game] class while keeping a layer of separation.
 */
export default class SceneManager {
	/** The current Scene of the game */
	protected currentScene: Scene | null;

	/** The Viewport of the game */
	protected viewport: Viewport;

	/** A reference to the ResourceManager */
	protected resourceManager: ResourceManager;

	/** A counter to keep track of game ids */
	protected idCounter: number;

	/** The RenderingManager of the game */
	protected renderingManager: RenderingManager;

	/** For consistency, only change scenes at the beginning of the update cycle */
	protected pendingSceneConstr: (new (...args: any) => Scene) | null;
	protected pendingSceneOptions: Record<string, any> | undefined;
	protected pendingSceneInit: Record<string, any> | undefined;
	protected pendingSceneTransition: SceneTransitionOptions | null;
	protected pendingSceneSwapAtMs: number | null;
	protected pendingScenePauseDuringFadeOut: boolean;
	private readonly defaultLoadingOverlayDelayMs = 100;
	private readonly defaultLoadingOverlayMinVisibleMs = 0;
	private readonly defaultFadeOutMs = 200;
	private readonly defaultFadeInMs = 200;

	protected receiver: Receiver;

	/**
	 * Creates a new SceneManager
	 * @param viewport The Viewport of the game
	 * @param game The Game instance
	 * @param renderingManager The RenderingManager of the game
	 */
	constructor(viewport: Viewport, renderingManager: RenderingManager){
		this.resourceManager = ResourceManager.getInstance();
		this.viewport = viewport;
		this.renderingManager = renderingManager;
		this.idCounter = 0;
		this.currentScene = null;
		this.pendingSceneConstr = null;
		this.pendingSceneOptions = undefined;
		this.pendingSceneTransition = null;
		this.pendingSceneSwapAtMs = null;
		this.pendingScenePauseDuringFadeOut = true;

		this.receiver = new Receiver();
		this.receiver.subscribe(GameEventType.CHANGE_SCENE);
	}

	/**
	 * Add a scene as the main scene.
	 * Use this method if you've created a subclass of Scene, and you want to add it as the main Scene.
	 * @param constr The constructor of the scene to add
	 * @param init An object to pass to the init function of the new scene
	 */
	public changeToScene<T extends Scene>(constr: new (...args: any) => T, init?: Record<string, any>, options?: Record<string, any>, transition?: SceneTransitionOptions): void {
		console.log("Creating the new scene - change is pending until next update");
		this.pendingSceneConstr = constr;
		this.pendingSceneOptions = options;
		this.pendingSceneInit = init;
		this.pendingSceneTransition = transition ?? null;
		this.pendingSceneSwapAtMs = null;
		this.pendingScenePauseDuringFadeOut = true;
	}

	protected doSceneChange(){
		if(!this.pendingSceneConstr){
			return;
		}

		if(this.pendingSceneSwapAtMs === null){
			const transition = this.pendingSceneTransition;
			this.pendingSceneTransition = null;
			this.resourceManager.loadingOverlayEnabled = transition?.showLoadingOverlay === true;
			this.resourceManager.loadingOverlayDelayMs = transition?.loadingOverlayDelayMs ?? this.defaultLoadingOverlayDelayMs;
			this.resourceManager.loadingOverlayMinVisibleMs = transition?.loadingOverlayMinVisibleMs ?? this.defaultLoadingOverlayMinVisibleMs;
			this.resourceManager.transitionFadeEnabled = transition?.useFadeTransition === true;
			this.resourceManager.transitionFadeOutMs = transition?.fadeOutMs ?? this.defaultFadeOutMs;
			this.resourceManager.transitionFadeInMs = transition?.fadeInMs ?? this.defaultFadeInMs;
			this.pendingScenePauseDuringFadeOut = transition?.pauseDuringFadeOut ?? true;

			// Trigger transition visuals immediately so fast scene loads don't briefly expose the next scene.
			if(this.resourceManager.onLoadProgress){
				this.resourceManager.onLoadProgress(0);
			}

			if(this.resourceManager.transitionFadeEnabled && this.resourceManager.transitionFadeOutMs > 0){
				this.pendingSceneSwapAtMs = performance.now() + this.resourceManager.transitionFadeOutMs;
				return;
			}
		} else if(performance.now() < this.pendingSceneSwapAtMs){
			return;
		}

		this.pendingSceneSwapAtMs = null;
		this.pendingScenePauseDuringFadeOut = true;

		console.log("Performing scene change");
		
		if(this.currentScene){
			console.log("Unloading old scene")
			this.currentScene.unloadScene();

			console.log("Destroying old scene");
			this.currentScene.destroy();
		}

		console.log("Unloading old resources...");
		this.resourceManager.unloadAllResources();

		const nextScene = new this.pendingSceneConstr(this.viewport, this, this.renderingManager, this.pendingSceneOptions);

		// Make the pending scene the current one
		this.currentScene = nextScene;

		// Clear pending scene request
		this.pendingSceneConstr = null;
		this.pendingSceneOptions = undefined;

		// Init the scene
		this.currentScene.initScene(this.pendingSceneInit ?? {});

		// Enqueue all scene asset loads
		this.currentScene.loadScene();

		// Load all assets
		console.log("Starting Scene Load");
		this.resourceManager.loadResourcesFromQueue(() => {
			console.log("Starting Scene");
			if(this.currentScene){
				this.currentScene.startScene();
				this.currentScene.setRunning(true);
			}
		});

		this.renderingManager.setScene(this.currentScene);
	}
	
	/**
	 * Generates a unique ID
	 * @returns A new ID
	 */
	public generateId(): number {
		return this.idCounter++;
	}

	/**
	 * Renders the current Scene
	 */
	public render(): void {
		if(this.currentScene){
			this.currentScene.render();
		}
	}

	/**
	 * Updates the current Scene
	 * @param deltaT The timestep of the Scene
	 */
	public update(deltaT: number){
		while (this.receiver.hasNextEvent()) {
			let ev = this.receiver.getNextEvent();
			if (ev.type === GameEventType.CHANGE_SCENE) this.changeToScene(ev.data.get("scene"), ev.data.get("init"), ev.data.get("options"), ev.data.get("transition"));
		}

		if(this.pendingSceneConstr !== null){
			this.doSceneChange();
			if (this.pendingSceneConstr !== null) {
				if (!this.pendingScenePauseDuringFadeOut && this.pendingSceneSwapAtMs !== null && this.currentScene && this.currentScene.isRunning()) {
					this.currentScene.update(deltaT);
				}
				return;
			}
		}

		if(this.currentScene && this.currentScene.isRunning()){
			this.currentScene.update(deltaT);
		}
	}
}
