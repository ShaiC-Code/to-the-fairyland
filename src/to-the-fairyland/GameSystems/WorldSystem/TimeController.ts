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
            new Color(0, 0, 0, 0.3),
            this.player,
            Math.min(this.viewport.getHalfSize().x, this.viewport.getHalfSize().y) * 0.6,
            0.7
        );
    }

    update(deltaT: number): void {
        this.timeTintOverlay.update(deltaT);
        this.timeSpotlightOverlay.update(deltaT);
    }
    
    public setTimeOfDay(time: TimeOfDay): void {
        const color = this.getColorForTime(time);
        this.timeTintOverlay.setOverlayColor(color);

        // Add spotlight overlay for DUSK
        if (time === TimeOfDay.DUSK) {
            this.timeSpotlightOverlay?.show();
        } else {
            this.timeSpotlightOverlay?.hide();
        }
    }  

    private getColorForTime(time: TimeOfDay): Color {
        switch (time) {
            case TimeOfDay.DAY:  return new Color(0, 0, 0, 0);
            case TimeOfDay.NOON:  return new Color(200, 140, 60, 0.30);
            case TimeOfDay.DUSK:  return new Color(30, 20, 60, 0.45);
            case TimeOfDay.NIGHT: return new Color(10, 10, 60, 0.75);
            default:              return new Color(0, 0, 0, 0);;
        }
    }
}