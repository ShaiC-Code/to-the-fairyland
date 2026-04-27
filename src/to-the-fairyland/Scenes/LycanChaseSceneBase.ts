import { TiledObject, TiledTilemapData } from "../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../Actors/NPCActor";
import IdleBehavior from "../AI/NPC/NPCBehavior/IdleBehavior";
import LycanChaseBehavior from "../AI/NPC/NPCBehavior/LycanChaseBehavior";
import { LycanEvent } from "../Events";
import { AssetBundle } from "./MappedAdventureScene";
import MappedAdventureChapter2Scene from "./Chapter2/MappedAdventureChapter2Scene";
import PlayerDeathHitOverlay from "../Overlays/PlayerDeathHitOverlay";
import GameOverScreenScene from "./GameOverScreenScene";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";

export default abstract class LycanChaseSceneBase extends MappedAdventureChapter2Scene {
    protected lycans: NPCActor[] = [];
    protected lycanDeathHitOverlay!: PlayerDeathHitOverlay;
    private lycanDeathSequencePlaying = false;

    protected readonly lycanDeathHitLayerName = "lycanDeathHitLayer";


    protected readonly lycanMoveDuration = 0.16;
    protected readonly lycanRepathInterval = 0.25;
    protected readonly lycanFeetOffsetY = 15;
    protected readonly lycanBoostMoveDuration = 0.07;
    protected readonly lycanBoostChance = 0.20;
    protected readonly lycanBoostMinSteps = 2;
    protected readonly lycanBoostMaxSteps = 5;
    protected readonly lycanBoostLocksDirection = true;
    protected readonly lycanCatchCooldown = 0.8;
    protected readonly lycanCaughtFlashLayerName = "lycanCaughtFlashLayer";

    protected static readonly lycanAssetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            Lycan: { key: "Lycan", path: "/assets/spritesheets/Lycan.json" }
        },
        sprites: {},
        sounds: {
            wolvesRunningSFX: { key: "wolves-running", path: "/assets/sounds/wolves-running.ogg" },
            wolvesDashingSFX: { key: "wolves-dashing", path: "/assets/sounds/wolves-dashing.ogg" },
            wolvesBitingSFX: { key: "wolves-biting", path: "/assets/sounds/wolves-biting.ogg" },
            wolvesFerociousSFX: { key: "wolves-ferocious", path: "/assets/sounds/wolves-ferocious.ogg" },
        }
    };

    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(
            super.combinedAssetBundles(),
            LycanChaseSceneBase.lycanAssetBundle
        );
    }
    
    public override unloadScene(): void {
        super.unloadScene();
        this.keepAssets(LycanChaseSceneBase.assetBundle);

        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.assets.sounds.wolvesRunningSFX.key });
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.assets.sounds.wolvesFerociousSFX.key });
    }

    public override startScene(): void {
        super.startScene();

        this.lycanDeathHitOverlay = new PlayerDeathHitOverlay(
            this.lycanDeathHitLayerName,
            this,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            {
                useUILayer: true,
                depth: 10000,
                redFlashDelay: 0.5,
                redFlashDuration: 0.7,
                blackAfterFlashDuration: 0.5,
                maxRedAlpha: 0.85
            }
        );
        

        this.receiver.subscribe(LycanEvent.PLAYER_CAUGHT);

        if (this.storyManager.chapter2.needsToEscapeLycans()) {
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
                key: this.assets.sounds.wolvesRunningSFX.key,
                loop: true,
                holdReference: true
            });
            this.emitter.fireEvent(GameEventType.PLAY_SFX, {
                key: this.assets.sounds.wolvesFerociousSFX.key,
                loop: true,
                holdReference: true
            });
        }
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.handleLycanEvents();
        this.lycanDeathHitOverlay?.update(deltaT);

        if (this.lycanDeathSequencePlaying) {
            this.setWorldPaused(true);
        }
    }

    protected resetLycans(): void {
        this.lycans = [];
    }

    protected spawnLycansMatching(
        tilemapData: TiledTilemapData,
        predicate: (obj: TiledObject) => boolean
    ): void {
        const lycanLayer = tilemapData.layers.find(layer => layer.name === "EnemySpawns");
        const lycanPoints = lycanLayer?.objects.filter(predicate) ?? [];

        for (const obj of lycanPoints) {
            this.spawnLycan(obj);
        }
    }

    protected spawnLycansWithPrefix(tilemapData: TiledTilemapData, prefix: string): void {
        this.spawnLycansMatching(tilemapData, obj =>
            obj.name.startsWith(`${prefix}_`)
        );
    }

    protected startAllLycanChases(): void {
        for (const lycan of this.lycans) {
            lycan.addAI(LycanChaseBehavior, {
                player: this.player,
                ground: this.ground,
                collision: this.collision,
                startTile: lycan.getSortTile(),
                moveDuration: this.lycanMoveDuration,
                repathInterval: this.lycanRepathInterval,
                feetOffsetY: this.lycanFeetOffsetY,
                boostMoveDuration: this.lycanBoostMoveDuration,
                boostChance: this.lycanBoostChance,
                boostMinSteps: this.lycanBoostMinSteps,
                boostMaxSteps: this.lycanBoostMaxSteps,
                boostLocksDirection: this.lycanBoostLocksDirection,
                catchCooldown: this.lycanCatchCooldown
            });
            lycan.sceneAssets = this.assets;
        }
    }

    private handleLycanEvents(): void {
        while (this.receiver.hasNextEvent()) {
            const event = this.receiver.getNextEvent();
    
            if (event.type === LycanEvent.PLAYER_CAUGHT) {
                this.startLycanDeathSequence();
            }
        }
    }

    private startLycanDeathSequence(): void {
        if (this.lycanDeathSequencePlaying || this.cheatsEnabled) {
            return;
        }
    
        this.lycanDeathSequencePlaying = true;
        this.setWorldPaused(true);

        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.assets.sounds.wolvesBitingSFX.key,
            loop: false,
            holdReference: false
        });
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.assets.sounds.wolvesRunningSFX.key });
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.assets.sounds.wolvesFerociousSFX.key });
    
        this.lycanDeathHitOverlay.play({
            deathSFXKey: this.assets.sounds.playerDeathSFX?.key,
            onComplete: () => {
                this.sceneManager.changeToScene(
                    GameOverScreenScene,
                    undefined,
                    undefined,
                    {
                        useFadeTransition: true,
                        fadeOutMs: 0,
                        fadeInMs: 0
                    }
                );
            }
        });
    }

    private spawnLycan(obj: TiledObject): void {
        const lycan = this.add.animatedSprite(
            NPCActor,
            this.assets.spritesheets.Lycan.key,
            this.actorLayerName
        );

        lycan.scale.set(1.25, 1.25);

        const tile = this.getObjectTile(obj);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);

        lycan.position.set(
            tileCenter.x,
            tileCenter.y - lycan.size.y / 2 + this.lycanFeetOffsetY
        );

        lycan.setSortTile(tile);
        lycan.setSortOrder(10);

        const facing = obj.properties?.find(prop => prop.name === "facing")?.value;
        lycan.animation.play(this.getLycanIdleAnimationForFacing(facing), true);
        lycan.addAI(IdleBehavior, {});

        this.lycans.push(lycan);
    }

    private getLycanIdleAnimationForFacing(facing: string | undefined): string {
        if (facing === "up") return "IDLE_UP";
        if (facing === "left") return "IDLE_LEFT";
        if (facing === "right") return "IDLE_RIGHT";
        return "IDLE_DOWN";
    }
}
