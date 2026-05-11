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
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import FreshPrettyTooth from "../../GameSystems/ItemSystem/Items/FreshPrettyTooth";
import { Chapter3MainQuestStep } from "../../GameSystems/StorySystem/StoryState";
import AudioController from "../../GameSystems/AudioController";

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
            }
        },
        sprites: {
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
    private toothFairyIntroStarted = false;
    private toothFairyHealingCompleted = false;
    private healingParticleEffect!: HealingParticleEffect;
    private activeToothFairyHealers = new Map<AnimatedSprite, ToothFairyHealingState>();
    private cliffFallIntroStarted = false;


    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), CliffBottomScene.assetBundle);
    }

    protected override configureLayers(): void {
        super.configureLayers();
        this.addLayer(this.healingParticleLayerName, this.actorLayerDepth + 2);
    }

    public override startScene(): void {
        super.startScene();
        this.healingParticleEffect = new HealingParticleEffect(
            this,
            this.healingParticleLayerName,
            this.assets.sprites.healingParticle.key
        );

        if (this.storyManager.chapter3.isPlayerFainted()) {
            this.playerFaint();
            this.startCliffFallIntroCutsceneIfNeeded();
        }
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updateToothFairyHealing(deltaT);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToDeeperForest") {
            this.changeToForestSection(DeeperForestScene, "RoadStart");
        }
    }

    private readonly fairySpawnLayerName = "FairySpawns";
    private readonly healingParticleLayerName = "HealingParticles";
    private readonly fairyEscortTargetName = "RoadEnd";
    private readonly toothFairyHealAmount = 5;
    private readonly toothFairyHealIntervalSeconds = 0.35;
    private readonly healingParticleOriginOffsetY = 0;
    private readonly cliffFallIntroSpawnName = "RoadStart";

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);
    
        this.toothFairies = [];

        if (!this.shouldSpawnToothFairies()) {
            return;
        }

        this.spawnToothFairiesFromLayer(tilemapData, this.fairySpawnLayerName);
    }

    private shouldSpawnToothFairies(): boolean {
        return !this.storyManager.chapter3.hasReachedStep(Chapter3MainQuestStep.NEED_EXCALIBUR);
    }

    private startCliffFallIntroCutsceneIfNeeded(): void {
        if (!this.shouldStartCliffFallIntroCutscene()) {
            return;
        }

        this.cliffFallIntroStarted = true;
        this.setWorldTimeScale(0);
        this.dialogueController.setCutsceneMode(true);
        AudioController.getInstance().playSFX(this.assets.sounds.playerHurtFatalSFX.key);
        this.startDialogue(
            dialogue(
                [
                    "Your body fall through the air.",
                    "Then the ground finds you.",
                    "You can only felt pain..."
                ],
                {
                    onComplete: () => {
                        this.dialogueController.setCutsceneMode(false);
                        this.setWorldTimeScale(1);
                    }
                }
            )
        );
    }

    private shouldStartCliffFallIntroCutscene(): boolean {
        return !this.cliffFallIntroStarted
            && !this.fromResumeLoad
            && this.spawnName === this.cliffFallIntroSpawnName
            && this.storyManager.chapter3.getMainQuestStep() === Chapter3MainQuestStep.FAINTED;
    }

    protected override getToothFairyPlayerArrivalHandler(): (fairy: AnimatedSprite) => void {
        return (fairy: AnimatedSprite) => this.startToothFairyHealing(fairy);
    }

    protected override getFairyEscortTargetName(): string {
        return this.fairyEscortTargetName;
    }

    protected override attractToothFairy(fairy: AnimatedSprite): void {
        if (
            this.storyManager.chapter3.getMainQuestStep() === Chapter3MainQuestStep.HEALED_BY_TOOTH_FAIRY
            || this.toothFairyHealingCompleted
        ) {
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
        if (this.activeToothFairyHealers.size === 0) {
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
        this.healPlayer(this.toothFairyHealAmount);
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
        this.removeFreshPrettyTooth();
        this.healByToothFairy();
        this.gameSessionManager.saveCurrentSession();
        this.startFairyEscortToMarker(this.fairyEscortTargetName);
    }

    private removeFreshPrettyTooth(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const tooth = inventory.find(item => item instanceof FreshPrettyTooth);

        if (tooth) {
            inventory.remove(tooth.id);
        }
    }

    private healByToothFairy(): void {
        this.storyManager.chapter3.markHealedByToothFairy();
        this.playerUnfaint();
    
        // optional healed dialogue / animation
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
