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
	useFadeTransition?: boolean;
	fadeOutMs?: number;
	fadeInMs?: number;
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
	protected pendingScene: Scene | null;
	protected pendingSceneInit: Record<string, any> | undefined;
	protected pendingSceneTransition: SceneTransitionOptions | null;
	private readonly defaultLoadingOverlayDelayMs = 100;
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
		this.pendingScene = null;
		this.pendingSceneTransition = null;

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
		this.pendingScene = new constr(this.viewport, this, this.renderingManager, options);
		this.pendingSceneInit = init;
		this.pendingSceneTransition = transition ?? null;
	}

	protected doSceneChange(){
		if(!this.pendingScene){
			return;
		}

		console.log("Performing scene change");
		this.viewport.setCenter(this.viewport.getHalfSize().x, this.viewport.getHalfSize().y);
		
		if(this.currentScene){
			console.log("Unloading old scene")
			this.currentScene.unloadScene();

			console.log("Destroying old scene");
			this.currentScene.destroy();
		}

		console.log("Unloading old resources...");
		this.resourceManager.unloadAllResources();

		// Make the pending scene the current one
		this.currentScene = this.pendingScene;

		// Make the pending scene null
		this.pendingScene = null;

		const transition = this.pendingSceneTransition;
		this.pendingSceneTransition = null;
		this.resourceManager.loadingOverlayEnabled = transition?.showLoadingOverlay === true;
		this.resourceManager.loadingOverlayDelayMs = transition?.loadingOverlayDelayMs ?? this.defaultLoadingOverlayDelayMs;
		this.resourceManager.transitionFadeEnabled = transition?.useFadeTransition === true;
		this.resourceManager.transitionFadeOutMs = transition?.fadeOutMs ?? this.defaultFadeOutMs;
		this.resourceManager.transitionFadeInMs = transition?.fadeInMs ?? this.defaultFadeInMs;

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

		if(this.pendingScene !== null){
			this.doSceneChange();
		}

		if(this.currentScene && this.currentScene.isRunning()){
			this.currentScene.update(deltaT);
		}
	}
}