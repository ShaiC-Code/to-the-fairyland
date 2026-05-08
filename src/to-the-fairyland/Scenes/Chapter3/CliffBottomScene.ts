import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import ForestSceneBase from "./ForestSceneBase";
import DeeperForestScene from "./DeeperForestScene";
import { AssetBundle } from "../MappedAdventureScene";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerControlMode } from "../../AI/Player/PlayerController";
import ToothFairyApproachBehavior from "../../AI/NPC/NPCBehavior/ToothFairyApproachBehavior";

export default class CliffBottomScene extends ForestSceneBase {
    protected readonly tilemap = {
        key: "cliffBottom",
        path: "/assets/tilemaps/Chapter3/CliffBottom.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {
            fateDrown: {
                key: "fateDrown",
                path: "/assets/spritesheets/FateDrown.json"
            },
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

    private faintSprite: AnimatedSprite | null = null;
    private faintLockActive = false;
    private toothFairies: AnimatedSprite[] = [];
    private toothFairyIntroStarted = false;


    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), CliffBottomScene.assetBundle);
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(this.fairyParticleLayerName, this.actorLayerDepth + 0.5);
    }

    public override startScene(): void {
        super.startScene();

        for (const fairy of this.toothFairies) {
            fairy.addAI(ToothFairyApproachBehavior, {
                player: this.player,
                particleSpriteKey: this.assets.sprites.fairyParticle1.key,
                particleLayerName: this.fairyParticleLayerName
            });
        }
        
        if (this.storyManager.chapter3.isPlayerFainted()) {
            this.playerFaint();
        }
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadStart");
        }
    }

    private readonly fairySpawnLayerName = "FairySpawns";
    private readonly fairyParticleLayerName = "FairyParticles";
    private readonly fairyFeetOffsetY = 20;

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);
    
        this.toothFairies = [];
    
        const fairyLayer = tilemapData.layers.find(
            layer => layer.name === this.fairySpawnLayerName
        );
    
        const fairySpawns = fairyLayer?.objects ?? [];
    
        for (const spawn of fairySpawns) {
            this.spawnToothFairy(spawn);
        }
    }
    

    private spawnToothFairy(spawn: TiledObject): void {
        const fairy = this.add.animatedSprite(
            AnimatedSprite,
            this.assets.spritesheets.toothFairy.key,
            this.actorLayerName
        );

        const tile = this.getObjectTile(spawn);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);

        fairy.position.set(
            tileCenter.x,
            tileCenter.y - fairy.size.y / 2 + this.fairyFeetOffsetY
        );

        fairy.setSortTile(tile);
        fairy.setSortOrder(1);

        const facing = spawn.properties?.find(prop => prop.name === "facing")?.value;
        fairy.animation.play(facing === "left" ? "IDLE_LEFT" : "IDLE_RIGHT", true);

        this.toothFairies.push(fairy);
    }

    protected override getToothFairies(): AnimatedSprite[] {
        return this.toothFairies;
    }

    protected override attractToothFairy(fairy: AnimatedSprite): void {
        const ai = fairy.ai as ToothFairyApproachBehavior;
        ai.startAttraction();

        if (this.toothFairyIntroStarted) {
            return;
        }

        this.toothFairyIntroStarted = true;
        this.storyManager.chapter3.markToothFairyAttracted();
        this.playerFaint();
    }

    private healByToothFairy(): void {
        this.storyManager.chapter3.markHealedByToothFairy();
        this.playerUnfaint();
    
        // optional healed dialogue / animation
    }
    
    private finishToothFairyIntro(): void {
        this.storyManager.chapter3.markNeedExcalibur();
    }
    
    private playerFaint(): void {
        const ai = this.player.ai as PlayerAI;
    
        ai.targetTile = null;
        ai.moving = false;
        ai.moveProgress = 0;
        ai.moveStart = this.player.position.clone();
        ai.moveEnd = this.player.position.clone();
    
        if (!this.faintSprite) {
            this.faintSprite = this.add.animatedSprite(
                AnimatedSprite,
                this.assets.spritesheets.fateDrown.key,
                this.actorLayerName
            );
    
            this.faintSprite.animation.play("Drown", true);
        }
    
        this.faintSprite.position.copy(this.player.position);
        this.faintSprite.setSortTile(this.player.getSortTile());
        this.faintSprite.setSortOrder(this.player.getSortOrder());
    
        this.player.visible = false;
    
        if (!this.faintLockActive) {
            ai.controller.setControlMode(PlayerControlMode.FAINTED);
            this.faintLockActive = true;
        }
    }
    
    private playerUnfaint(): void {
        const ai = this.player.ai as PlayerAI;
    
        if (this.faintSprite) {
            this.faintSprite.destroy();
            this.faintSprite = null;
        }
    
        this.player.visible = true;
        this.playIdleForFacing(ai.facing);
    
        if (this.faintLockActive) {
            this.unlockPlayerInput();
            this.faintLockActive = false;
        }
    }
    
}

