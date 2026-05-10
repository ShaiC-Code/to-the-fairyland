import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import DesertCentipedeController from "../../AI/NPC/NPCController/DesertCentipedeController";
import AudioController from "../../GameSystems/AudioController";
import { dialogue } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import EmeraldPondScene from "../Chapter7/EmeraldPondScene";
import DesertSceneBase from "./DesertSceneBase";
import DesertPath1Scene from "./DesertPath1Scene";

export default class DesertPondScene extends DesertSceneBase {
    protected readonly tilemap = {
        key: "desertPond",
        path: "/assets/tilemaps/Chapter4/DesertPond.json"
    };

    private path1TransitionStarted = false;
    private pondEscapeStarted = false;
    private pondCentipedes: DesertCentipedeController[] = [];
    private pondCentipedeBottomSpawnTiles: Vec2[] = [];
    private pondCentipedeCleanupY = 0;
    private readonly storyManager = StoryManager.getInstance();
    private readonly pondCentipedeBottomObjectName = "CentipedeBottom";
    private readonly pondCentipedeBodySegments = 26;
    private readonly pondCentipedeSpeed = 2600;
    private readonly pondCentipedeCleanupPadding = 256;

    public override startScene(): void {
        this.path1TransitionStarted = false;
        this.pondEscapeStarted = false;
        this.pondCentipedes = [];
        this.pondCentipedeBottomSpawnTiles = [];
        this.pondCentipedeCleanupY = 0;
        super.startScene();
    }

    public override unloadScene(): void {
        this.destroyPondCentipede();
        this.setWorldTimeScale(1);
        super.unloadScene();
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);

        const enemySpawnLayer = tilemapData.layers.find(layer => layer.name === this.enemySpawnLayerName);
        const bottomSpawn = enemySpawnLayer?.objects.find(obj => obj.name === this.pondCentipedeBottomObjectName);
        this.pondCentipedeBottomSpawnTiles = bottomSpawn
            ? this.getTilesCoveredByObject(bottomSpawn).sort((a, b) => a.x - b.x || a.y - b.y)
            : [];
    }

    protected override updateGameplay(deltaT: number): void {
        super.updateGameplay(deltaT);
        this.updatePondCentipede(deltaT);
    }

    public override render(): void {
        super.render();

        if (!this.showCentipedeHurtDebug || this.pondCentipedes.length === 0) {
            return;
        }

        const viewScale = this.getViewScale();
        for (const centipede of this.pondCentipedes) {
            this.renderCentipedeHurtDebug(centipede, viewScale);
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "EmeraldPond") {
            this.startPondEscape();
            return;
        }

        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToPath1") {
            this.gotoDesertPath1();
        }
    }

    private startPondEscape(): void {
        if (this.pondEscapeStarted || this.transitioning) {
            return;
        }

        this.pondEscapeStarted = true;
        this.setWorldTimeScale(0.1);
        this.spawnPondCentipede();

        this.startDialogue(
            dialogue(
                [
                    "The emerald water blazes like a wound in the world.",
                    "Behind you, the sand splits open.",
                    "A wall of centipedes rises from below.",
                    "There is no time left.",
                    "You jump."
                ],
                { onComplete: () => void this.finishPondEscape() }
            ),
            undefined,
            { layoutMode: "topRightQuarter" }
        );
    }

    private async finishPondEscape(): Promise<void> {
        this.setWorldTimeScale(1);

        if (this.transitioning || this.player.health <= 0) {
            return;
        }

        this.lockPlayerInput();
        this.setPlayerFacing(Vec2.UP);
        AudioController.getInstance().playSFX(this.assets.sounds.pondSplashSFX.key);
        await this.movePlayerOneTileForwardAsync({ ignoreCollision: true });
        this.gotoEmeraldPond();
    }

    private spawnPondCentipede(): void {
        if (this.pondCentipedes.length > 0) {
            return;
        }

        const spawnTiles = this.pondCentipedeBottomSpawnTiles.length > 0
            ? this.pondCentipedeBottomSpawnTiles
            : [this.getFallbackPondCentipedeSpawnTile()];

        this.pondCentipedes = spawnTiles.map(spawnTile =>
            this.createDesertCentipedeAtTile(spawnTile, {
                facing: "up",
                bodySegments: this.pondCentipedeBodySegments,
                uniform: true,
                moveSpeed: this.pondCentipedeSpeed,
                chargeMoveSpeed: this.pondCentipedeSpeed,
                playSpawnEffects: false
            })
        );

        this.cameraController.shake(500, 50);
        AudioController.getInstance().playSound(this.assets.sounds.centipedesUnburrowingSFX.key);
        this.pondCentipedeCleanupY = -this.pondCentipedeCleanupPadding;
    }

    private updatePondCentipede(deltaT: number): void {
        if (this.pondCentipedes.length === 0) {
            return;
        }

        const remainingCentipedes: DesertCentipedeController[] = [];
        let playerHit = false;

        for (const centipede of this.pondCentipedes) {
            centipede.updateStraight(deltaT, Vec2.UP, this.pondCentipedeSpeed);

            if (!playerHit && centipede.overlapsCircle(this.getCentipedePlayerHurtCenter(), this.centipedePlayerHurtRadius)) {
                playerHit = true;
                this.setWorldTimeScale(1);
                this.damagePlayer(
                    Math.max(this.player.health, this.player.maxHealth),
                    {
                        ignoreCooldown: true,
                        source: "pondCentipede"
                    }
                );
            }

            if (centipede.getTailPosition().y <= this.pondCentipedeCleanupY) {
                centipede.destroy();
                continue;
            }

            remainingCentipedes.push(centipede);
        }

        this.pondCentipedes = remainingCentipedes;
    }

    private destroyPondCentipede(): void {
        for (const centipede of this.pondCentipedes) {
            centipede.destroy();
        }

        this.pondCentipedes = [];
    }

    private getFallbackPondCentipedeSpawnTile(): Vec2 {
        const dimensions = this.ground.getDimensions();
        return new Vec2(
            Math.floor(dimensions.x / 2),
            dimensions.y
        );
    }

    private gotoEmeraldPond(): void {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;
        if (this.gameSessionManager.getStoryState().chapter4) {
            this.storyManager.chapter4.markJumpedIntoEmeraldPond();
        }

        this.sceneManager.changeToScene(
            EmeraldPondScene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "Fate"
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }

    private gotoDesertPath1(): void {
        if (this.path1TransitionStarted) {
            return;
        }

        this.path1TransitionStarted = true;
        this.transitioning = true;
        this.sceneManager.changeToScene(
            DesertPath1Scene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "PathToPond"
            },
            undefined,
            {
                showLoadingOverlay: true,
                useFadeTransition: true,
                fadeOutMs: 500,
                fadeInMs: 500
            }
        );
    }
}
