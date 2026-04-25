import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import Color from "../../../Wolfie2D/Utils/Color";
import PlayerActor from "../../Actors/PlayerActor";
import SpotlightEffectOverlay from "../../Overlays/SpotlightEffectOverlay";
import TintEffectOverlay from "../../Overlays/TintEffectOverlay";
import { TimeOfDay } from "./WorldState";

export default class TimeController implements Updateable {
    protected scene: Scene;
    protected viewport: Viewport;
    protected player?: PlayerActor;

    private timeTintOverlay: TintEffectOverlay;
    private timeSpotlightOverlay: SpotlightEffectOverlay;

    private readonly timeTintLayerName = "timeTintLayer";
    private readonly timeSpotlightEffectLayerName = "timeSpotlightEffectLayer";

    constructor(scene: Scene, viewport: Viewport, player?: PlayerActor) {
        this.scene = scene;
        this.viewport = viewport;
        this.player = player;

        this.timeTintOverlay = new TintEffectOverlay(
            this.timeTintLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            new Color(0, 0, 0, 0)
        );

        this.timeSpotlightOverlay = new SpotlightEffectOverlay(
            this.timeSpotlightEffectLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            new Color(0, 0, 0, 0.9),
            this.player,
            Math.min(this.viewport.getHalfSize().x, this.viewport.getHalfSize().y) * 3.3,
            0
        );
    }

    update(deltaT: number): void {
        this.timeTintOverlay.update(deltaT);
        this.timeSpotlightOverlay.update(deltaT);
    }
    
    public setTimeOfDay(time: TimeOfDay): void {
        const color = this.getColorForTime(time);
        if (color) {
            this.timeTintOverlay.setOverlayColor(color);
            this.timeTintOverlay.show();
        } else {
            this.timeTintOverlay.hide();
        }

        // Add spotlight overlay for DUSK
        if (time === TimeOfDay.NIGHT) {
            this.timeSpotlightOverlay?.show();
        } else {
            this.timeSpotlightOverlay?.hide();
        }
    }  

    private getColorForTime(time: TimeOfDay): Color | null {
        switch (time) {
            case TimeOfDay.DAY:  return null;
            case TimeOfDay.NIGHT:  return new Color(30, 20, 60, 0.45);
            default:              return null;
        }
    }
}