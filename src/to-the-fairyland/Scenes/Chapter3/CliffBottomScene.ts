import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import ForestSceneBase from "./ForestSceneBase";
import DeeperForestScene from "./DeeperForestScene";
import { AssetBundle } from "../MappedAdventureScene";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerControlMode } from "../../AI/Player/PlayerController";
import ToothFairyApproachBehavior from "../../AI/NPC/NPCBehavior/ToothFairyApproachBehavior";
import HealingParticleEffect from "../../GameSystems/Effects/HealingParticleEffect";
import { Chapter3MainQuestStep } from "../../GameSystems/StorySystem/StoryState";

type ToothFairyHealingState = {
    healTimer: number;
};

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
            },
            healingParticle: {
                key: "healingParticle",
                path: "/assets/sprites/particles/healing.png"
            }
        },
        sounds: {},
        images: {}
    };

    private faintSprite: AnimatedSprite | null = null;
    private faintLockActive = false;
    private toothFairies: AnimatedSprite[] = [];
    private toothFairyIntroStarted = false;
    private toothFairyHealingCompleted = false;
    private toothFairyFadeOutActive = false;
    private toothFairyFadeOutTimer = 0;
    private healingParticleEffect!: HealingParticleEffect;
    private activeToothFairyHealers = new Map<AnimatedSprite, ToothFairyHealingState>();


    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), CliffBottomScene.assetBundle);
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(this.fairyParticleLayerName, this.actorLayerDepth + 0.5);
        this.addLayer(this.healingParticleLayerName, this.actorLayerDepth + 2);
    }

    public override startScene(): void {
        super.startScene();
        this.healingParticleEffect = new HealingParticleEffect(
            this,
            this.healingParticleLayerName,
            this.assets.sprites.healingParticle.key
        );

        for (const fairy of this.toothFairies) {
            fairy.addAI(ToothFairyApproachBehavior, {
                player: this.player,
                particleSpriteKey: this.assets.sprites.fairyParticle1.key,
                particleLayerName: this.fairyParticleLayerName,
                onArrive: (arrivedFairy: AnimatedSprite) => this.startToothFairyHealing(arrivedFairy)
            });
        }
        
        if (this.storyManager.chapter3.isPlayerFainted()) {
            this.playerFaint();
        } else if (this.storyManager.chapter3.getMainQuestStep() === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY) {
            this.resumeToothFairyFadeOut();
        }
    }

    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.updateToothFairyHealing(deltaT);
        this.updateToothFairyFadeOut(deltaT);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadStart");
        }
    }

    private readonly fairySpawnLayerName = "FairySpawns";
    private readonly fairyParticleLayerName = "FairyParticles";
    private readonly healingParticleLayerName = "HealingParticles";
    private readonly fairyFeetOffsetY = 20;
    private readonly toothFairyHealAmount = 5;
    private readonly toothFairyHealIntervalSeconds = 0.35;
    private readonly toothFairyFadeOutSeconds = 1;
    private readonly healingParticleOriginOffsetY = 0;

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);
    
        this.toothFairies = [];

        if (!this.shouldSpawnToothFairies()) {
            return;
        }
    
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

    private shouldSpawnToothFairies(): boolean {
        return !this.storyManager.chapter3.hasReachedStep(Chapter3MainQuestStep.NEED_EXCALIBUR);
    }

    protected override getToothFairies(): AnimatedSprite[] {
        return this.toothFairies;
    }

    protected override attractToothFairy(fairy: AnimatedSprite): void {
        if (this.toothFairyHealingCompleted || this.toothFairyFadeOutActive) {
            return;
        }

        const ai = fairy.ai as ToothFairyApproachBehavior;
        ai.startAttraction();

        if (this.toothFairyIntroStarted) {
            return;
        }

        this.toothFairyIntroStarted = true;
        this.storyManager.chapter3.markToothFairyAttracted();
        this.playerFaint();
    }

    private startToothFairyHealing(fairy: AnimatedSprite): void {
        if (
            this.toothFairyHealingCompleted
            || this.toothFairyFadeOutActive
            || this.activeToothFairyHealers.has(fairy)
        ) {
            return;
        }

        if (this.player.health >= this.player.maxHealth) {
            this.completeToothFairyHealing();
            return;
        }

        this.activeToothFairyHealers.set(fairy, {
            healTimer: 0
        });
    }

    private updateToothFairyHealing(deltaT: number): void {
        if (this.worldPaused || this.activeToothFairyHealers.size === 0) {
            return;
        }

        for (const [fairy, healingState] of this.activeToothFairyHealers) {
            if (this.player.health >= this.player.maxHealth) {
                this.activeToothFairyHealers.delete(fairy);
                continue;
            }

            healingState.healTimer -= deltaT;

            while (healingState.healTimer <= 0 && this.player.health < this.player.maxHealth) {
                this.applyToothFairyHeal();
                healingState.healTimer += this.toothFairyHealIntervalSeconds;
            }
        }

        if (this.player.health >= this.player.maxHealth) {
            this.completeToothFairyHealing();
        }
    }

    private applyToothFairyHeal(): void {
        this.spawnHealingParticleBurst();

        const nextHealth = Math.min(
            this.player.maxHealth,
            this.player.health + this.toothFairyHealAmount
        );

        this.player.health = nextHealth;
        this.playerStateManager.setHealth(nextHealth);
    }

    private spawnHealingParticleBurst(): void {
        this.healingParticleEffect.spawnBurst(this.getHealingParticleOrigin());
    }

    private getHealingParticleOrigin(): Vec2 {
        const origin = (this.faintSprite ?? this.player).position.clone();
        origin.y += this.healingParticleOriginOffsetY;
        return origin;
    }

    private completeToothFairyHealing(): void {
        if (this.toothFairyHealingCompleted) {
            return;
        }

        this.toothFairyHealingCompleted = true;
        this.activeToothFairyHealers.clear();
        this.healByToothFairy();
        this.startToothFairyFadeOut();
    }

    private resumeToothFairyFadeOut(): void {
        this.toothFairyHealingCompleted = true;
        this.activeToothFairyHealers.clear();
        this.playerUnfaint();
        this.startToothFairyFadeOut();
    }

    private startToothFairyFadeOut(): void {
        if (this.toothFairyFadeOutActive) {
            return;
        }

        this.toothFairyFadeOutActive = true;
        this.toothFairyFadeOutTimer = 0;

        for (const fairy of this.toothFairies) {
            fairy.alpha = 1;
        }
    }

    private updateToothFairyFadeOut(deltaT: number): void {
        if (!this.toothFairyFadeOutActive) {
            return;
        }

        this.toothFairyFadeOutTimer += deltaT;

        const fadeRatio = Math.min(1, this.toothFairyFadeOutTimer / this.toothFairyFadeOutSeconds);
        const alpha = 1 - fadeRatio;

        for (const fairy of this.toothFairies) {
            fairy.alpha = alpha;
        }

        if (fadeRatio < 1) {
            return;
        }

        this.toothFairyFadeOutActive = false;

        for (const fairy of this.toothFairies) {
            fairy.destroy();
        }

        this.toothFairies = [];
        this.finishToothFairyIntro();
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
