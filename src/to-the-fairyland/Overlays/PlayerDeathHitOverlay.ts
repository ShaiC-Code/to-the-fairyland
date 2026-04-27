import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import OverlayLayer, { OverlayLayerOptions } from "./OverlayLayer";

export type PlayerDeathHitOverlayOptions = OverlayLayerOptions & {
    redFlashDelay?: number;
    redFlashDuration?: number;
    blackAfterFlashDuration?: number;
    maxRedAlpha?: number;
};

export type PlayerDeathHitPlayOptions = {
    deathSFXKey?: string;
    onComplete?: () => void;
};

export default class PlayerDeathHitOverlay extends OverlayLayer {
    private readonly emitter = new Emitter();

    private readonly blackOverlayKey = "deathBlackOverlay";
    private readonly redOverlayKey = "deathRedOverlay";

    private readonly blackColor = new Color(0, 0, 0, 1);
    private readonly redColor = new Color(255, 0, 0, 0);

    private redFlashDelay: number;
    private redFlashDuration: number;
    private blackAfterFlashDuration: number;
    private maxRedAlpha: number;

    private elapsed = 0;
    private playing = false;
    private deathSFXPlayed = false;
    private deathSFXKey?: string;
    private onComplete?: () => void;

    constructor(
        layerName: string,
        scene: Scene,
        getViewportCenter: () => Vec2,
        getViewportHalfSize: () => Vec2,
        options?: PlayerDeathHitOverlayOptions
    ) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.redFlashDelay = options?.redFlashDelay ?? 0.35;
        this.redFlashDuration = options?.redFlashDuration ?? 0.45;
        this.blackAfterFlashDuration = options?.blackAfterFlashDuration ?? 0.5;
        this.maxRedAlpha = options?.maxRedAlpha ?? 0.85;

        this.initializeOverlay();
    }

    protected override initializeOverlay(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.addRect(this.blackOverlayKey, screenCenter, viewportSize, this.blackColor);
        this.addRect(this.redOverlayKey, screenCenter.clone(), viewportSize.clone(), this.redColor);

        this.layer.setHidden(true);
    }

    public override update(deltaT: number): void {
        this.updateBounds();
    
        if (!this.playing) {
            return;
        }
    
        this.elapsed += deltaT;
    
        if (this.elapsed < this.redFlashDelay) {
            this.setRedAlpha(0);
            return;
        }
    
        if (!this.deathSFXPlayed) {
            this.playDeathSFX();
            this.deathSFXPlayed = true;
        }
    
        const redElapsed = this.elapsed - this.redFlashDelay;
        const redProgress = Math.min(redElapsed / this.redFlashDuration, 1);
    
        this.setRedAlpha(this.maxRedAlpha * (1 - redProgress));
    
        const totalDuration =
            this.redFlashDelay +
            this.redFlashDuration +
            this.blackAfterFlashDuration;
    
            if (this.elapsed >= totalDuration) {
                const complete = this.onComplete;
            
                // Keep the black overlay visible while SceneManager queues the scene change.
                this.playing = false;
                complete?.();
            }
    }
    

    public play(options?: PlayerDeathHitPlayOptions): void {
        this.elapsed = 0;
        this.playing = true;
        this.deathSFXPlayed = false;
        this.deathSFXKey = options?.deathSFXKey;
        this.onComplete = options?.onComplete;

        this.show();
        this.updateBounds();
        this.setRedAlpha(0);
    }

    public stop(): void {
        this.elapsed = 0;
        this.playing = false;
        this.deathSFXPlayed = false;
        this.deathSFXKey = undefined;
        this.onComplete = undefined;
        this.setRedAlpha(0);
        this.hide();
    }

    private updateBounds(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        this.updateOverlayElement(this.getOverlayElement(this.blackOverlayKey), screenCenter, viewportSize);
        this.updateOverlayElement(this.getOverlayElement(this.redOverlayKey), screenCenter.clone(), viewportSize.clone());
    }

    private setRedAlpha(alpha: number): void {
        const redOverlay = this.getOverlayElement(this.redOverlayKey) as Rect | undefined;
        if (redOverlay) {
            redOverlay.alpha = Math.max(0, Math.min(alpha, this.maxRedAlpha));
        }
    }

    private playDeathSFX(): void {
        if (!this.deathSFXKey) {
            return;
        }

        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.deathSFXKey,
            loop: false,
            holdReference: false
        });
    }
}