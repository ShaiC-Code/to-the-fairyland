import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import ToothFairyApproachBehavior from "../../AI/NPC/NPCBehavior/ToothFairyApproachBehavior";
import { ItemUseAction, ItemUseActions, ItemUseResult } from "../../GameSystems/ItemSystem/ItemUseActions";
import { Chapter3MainQuestStep } from "../../GameSystems/StorySystem/StoryState";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter3Scene from "./MappedAdventureChapter3Scene";

export default abstract class ForestSceneBase extends MappedAdventureChapter3Scene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            toothFairy: {
                key: "toothFairy",
                path: "/assets/spritesheets/ToothFairy.json"
            }
        },
        sprites: {
            fairyParticle1: {
                key: "fairyParticle1",
                path: "/assets/sprites/particles/FairyParticle1.png"
            }
        },
        sounds: {},
        images: {}
    };

    protected toothFairies: AnimatedSprite[] = [];

    private readonly fairyParticleLayerName = "FairyParticles";
    private readonly fairyFeetOffsetY = 20;
    private readonly fairyEscortSpawnName = "RoadStart";
    private readonly fairyEscortSpawnCount = 3;
    private readonly fairyEscortHoldSeconds = 1;
    private readonly fairyEscortFadeOutSeconds = 1;
    private readonly fairyEscortAttractionStopDistance = 34;
    private readonly fairyEscortAttractionArriveRadius = 260;
    private readonly fairyEscortAttractionSpeed = 220;
    private readonly fairyEscortAttractionMinSpeed = 70;
    private readonly fairyEscortAttractionThrust = 180;
    private readonly fairyEscortAttractionWaveStrength = 80;

    private fairyEscortArrivals = new Set<AnimatedSprite>();
    private fairyEscortCompletesAtTarget = false;
    private fairyEscortHoldingAtTarget = false;
    private fairyEscortFadingOut = false;
    private fairyEscortHoldTimer = 0;
    private fairyEscortFadeOutTimer = 0;

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), ForestSceneBase.assetBundle);
    }

    protected override configureLayers(): void {
        this.getLayer("Bushes").setDepth(this.actorLayerDepth);
        this.getLayer("Ground").setDepth(2);
        this.getLayer("ForestTrees").setDepth(20);
        this.addLayer(this.fairyParticleLayerName, this.actorLayerDepth + 0.5);
    }

    public override startScene(): void {
        super.startScene();
        this.initializeToothFairyAIs();
        this.startSceneFairyEscortIfNeeded();
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.updateFairyEscort(deltaT);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const bushLayer = tilemapData.layers.find(layer => layer.name === "Bushes");
        const bushPoints = bushLayer?.objects.filter(obj => obj.name === "BushBerries") ?? [];

        for (const point of bushPoints) {
            const bush = this.add.sprite(this.assets.sprites.bushBerriesSprite.key, "Bushes");
            bush.position.set(point.x, point.y - bush.size.y / 2 + 20);
            bush.setSortTile(this.ground.getTilemapPosition(point.x, point.y));
            bush.setSortOrder(1);
        }

        const treeLayer = tilemapData.layers.find(layer => layer.name === "ForestTrees");
        const treePoints = treeLayer?.objects ?? [];

        for (const point of treePoints) {
            const tree = this.add.sprite(this.assets.sprites.forestTreeSprite.key, "ForestTrees");
            tree.position.set(point.x, point.y - tree.size.y / 2 + 100);
        }
    }

    protected override previewItemAction(action: ItemUseAction): ItemUseResult {
        if (action === ItemUseActions.HOLD_UP_TOOTH && this.isFairyEscortStoryActive()) {
            return {
                success: false,
                lines: ["The fairies are already leading the way."]
            };
        }

        return super.previewItemAction(action);
    }

    protected override runItemAction(action: ItemUseAction): ItemUseResult {
        if (action === ItemUseActions.HOLD_UP_TOOTH && this.isFairyEscortStoryActive()) {
            return {
                success: false,
                lines: ["The fairies are already leading the way."]
            };
        }

        return super.runItemAction(action);
    }

    protected override getToothFairies(): AnimatedSprite[] {
        return this.toothFairies;
    }

    protected spawnToothFairiesFromLayer(tilemapData: TiledTilemapData, layerName: string): void {
        const fairyLayer = tilemapData.layers.find(layer => layer.name === layerName);
        const fairySpawns = fairyLayer?.objects ?? [];

        for (const spawn of fairySpawns) {
            this.spawnToothFairyAtObject(spawn);
        }
    }

    protected getToothFairyPlayerArrivalHandler(): ((fairy: AnimatedSprite) => void) | null {
        return null;
    }

    protected getFairyEscortTargetName(): string | null {
        return null;
    }

    protected shouldCompleteFairyEscortAtTarget(): boolean {
        return false;
    }

    protected startFairyEscortToMarker(targetName: string, completesAtTarget = false): void {
        if (this.toothFairies.length === 0) {
            this.spawnFairyEscortAtMarker(this.fairyEscortSpawnName);
        }

        const target = this.findMapObjectByName(targetName);

        if (!target) {
            return;
        }

        this.fairyEscortArrivals.clear();
        this.fairyEscortCompletesAtTarget = completesAtTarget;
        this.fairyEscortHoldingAtTarget = false;
        this.fairyEscortFadingOut = false;
        this.fairyEscortHoldTimer = 0;
        this.fairyEscortFadeOutTimer = 0;

        for (let i = 0; i < this.toothFairies.length; i++) {
            const fairy = this.toothFairies[i];
            const ai = fairy.ai as ToothFairyApproachBehavior;
            const targetPosition = this.getFairyMarkerPosition(target, fairy, i);

            ai.startAttraction(targetPosition, {
                stopDistance: this.fairyEscortAttractionStopDistance,
                arriveRadius: this.fairyEscortAttractionArriveRadius,
                speed: this.fairyEscortAttractionSpeed,
                minSpeed: this.fairyEscortAttractionMinSpeed,
                thrust: this.fairyEscortAttractionThrust,
                waveStrength: this.fairyEscortAttractionWaveStrength,
                onArrive: arrivedFairy => this.handleFairyEscortArrival(arrivedFairy)
            });
        }
    }

    private initializeToothFairyAIs(): void {
        const onArrive = this.getToothFairyPlayerArrivalHandler() ?? undefined;

        for (const fairy of this.toothFairies) {
            fairy.addAI(ToothFairyApproachBehavior, {
                player: this.player,
                particleSpriteKey: this.assets.sprites.fairyParticle1.key,
                particleLayerName: this.fairyParticleLayerName,
                onArrive
            });
        }
    }

    private startSceneFairyEscortIfNeeded(): void {
        if (!this.isFairyEscortStoryActive()) {
            return;
        }

        const targetName = this.getFairyEscortTargetName();

        if (!targetName) {
            return;
        }

        this.startFairyEscortToMarker(targetName, this.shouldCompleteFairyEscortAtTarget());
    }

    private spawnFairyEscortAtMarker(markerName: string): void {
        const marker = this.findMapObjectByName(markerName);

        if (!marker) {
            return;
        }

        for (let i = 0; i < this.fairyEscortSpawnCount; i++) {
            const fairy = this.spawnToothFairyAtObject(marker, i);

            fairy.addAI(ToothFairyApproachBehavior, {
                player: this.player,
                particleSpriteKey: this.assets.sprites.fairyParticle1.key,
                particleLayerName: this.fairyParticleLayerName
            });
        }
    }

    private spawnToothFairyAtObject(obj: TiledObject, offsetIndex = 0): AnimatedSprite {
        const fairy = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.toothFairy.key,
            this.actorLayerName
        );

        fairy.position.copy(this.getFairyMarkerPosition(obj, fairy, offsetIndex));
        fairy.setSortTile(this.getObjectTile(obj));
        fairy.setSortOrder(1);

        const facing = obj.properties?.find(prop => prop.name === "facing")?.value;
        fairy.animation.play(facing === "left" ? "IDLE_LEFT" : "IDLE_RIGHT", true);

        this.toothFairies.push(fairy);
        return fairy;
    }

    private getFairyMarkerPosition(obj: TiledObject, fairy: AnimatedSprite, offsetIndex: number): Vec2 {
        const tile = this.getObjectTile(obj);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);
        const offset = this.getFairyEscortOffset(offsetIndex);

        return new Vec2(
            tileCenter.x + offset.x,
            tileCenter.y - fairy.size.y / 2 + this.fairyFeetOffsetY + offset.y
        );
    }

    private getFairyEscortOffset(index: number): Vec2 {
        const offsets = [
            new Vec2(-44, 8),
            new Vec2(0, -18),
            new Vec2(44, 8)
        ];

        return offsets[index % offsets.length];
    }

    private handleFairyEscortArrival(fairy: AnimatedSprite): void {
        this.fairyEscortArrivals.add(fairy);

        if (this.fairyEscortArrivals.size < this.toothFairies.length || !this.fairyEscortCompletesAtTarget) {
            return;
        }

        this.fairyEscortHoldingAtTarget = true;
        this.fairyEscortHoldTimer = 0;
    }

    private updateFairyEscort(deltaT: number): void {
        if (this.fairyEscortHoldingAtTarget) {
            this.fairyEscortHoldTimer += deltaT;

            if (this.fairyEscortHoldTimer >= this.fairyEscortHoldSeconds) {
                this.fairyEscortHoldingAtTarget = false;
                this.startFairyEscortFadeOut();
            }
        }

        if (!this.fairyEscortFadingOut) {
            return;
        }

        this.fairyEscortFadeOutTimer += deltaT;

        const fadeRatio = Math.min(1, this.fairyEscortFadeOutTimer / this.fairyEscortFadeOutSeconds);
        const alpha = 1 - fadeRatio;

        for (const fairy of this.toothFairies) {
            fairy.alpha = alpha;
        }

        if (fadeRatio < 1) {
            return;
        }

        this.finishFairyEscortFadeOut();
    }

    private startFairyEscortFadeOut(): void {
        this.fairyEscortFadingOut = true;
        this.fairyEscortFadeOutTimer = 0;

        for (const fairy of this.toothFairies) {
            fairy.alpha = 1;
        }
    }

    private finishFairyEscortFadeOut(): void {
        this.fairyEscortFadingOut = false;

        for (const fairy of this.toothFairies) {
            fairy.destroy();
        }

        this.toothFairies = [];
        this.storyManager.chapter3.markNeedExcalibur();
    }

    private findMapObjectByName(name: string): TiledObject | null {
        const tilemapData = this.resourceManager.getTilemap(this.tilemap.key) as TiledTilemapData;

        for (const layer of tilemapData.layers) {
            const match = layer.objects?.find(obj => obj.name === name);

            if (match) {
                return match;
            }
        }

        return null;
    }

    private isFairyEscortStoryActive(): boolean {
        return this.storyManager.chapter3.getMainQuestStep() === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY;
    }

    protected changeToForestSection(
        scene: new (...args: any[]) => ForestSceneBase,
        spawnName: string
    ): void {
        this.sceneManager.changeToScene(
            scene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName
            },
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: 300,
                fadeInMs: 300
            }
        );
    }
    
}
