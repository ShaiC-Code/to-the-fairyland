import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import { AssetBundle } from "../MappedAdventureScene";
import ForestSceneBase from "../ForestSceneBase";
import GreatTreeScene from "./GreatTreeScene";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { choiceOption, dialogue, dialogueWithChoice } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import Excalibur from "../../GameSystems/ItemSystem/Items/Excalibur";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import PlayerAI from "../../AI/Player/PlayerAI";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { Chapter4MainQuestStep } from "../../GameSystems/StorySystem/StoryState";

type VineAttackType = "normal" | "exit";

type VineAttack = {
    type: VineAttackType;
    start: Vec2;
    end: Vec2;
    direction: Vec2;
    distance: number;
    speed: number;
    spriteKey: string;
    progress: number;
    parts: Sprite[];
    blockedTiles: Vec2[];
    blocksTiles: boolean;
};

type VineAttackOptions = {
    type?: VineAttackType;
    blocksTiles?: boolean;
    speed?: number;
    spriteKey?: string;
};

export default class TreeInner extends ForestSceneBase {
    private readonly storyManager = StoryManager.getInstance();

    private excaliburSprite: Sprite | null = null;
    private excaliburObject: TiledObject | null = null;
    private pullingExcalibur = false;
    private excaliburPullElapsed = 0;
    private excaliburStartY = 0;

    private readonly excaliburPullDuration = 1.5;
    private readonly excaliburFadeDuration = 0.45;
    private readonly excaliburPullDistance = 96;

    private vineExitPoints: Map<string, TiledObject> = new Map();
    private vineTrapObjects: TiledObject[] = [];
    private vineTrapTiles: Map<string, TiledObject> = new Map();
    private triggeredVineTraps: Set<string> = new Set();
    private activeVineAttacks: VineAttack[] = [];
    private dynamicCollisionTiles: Map<string, { tile: Vec2; previousTile: number; count: number }> = new Map();
    private lastChapter4QuestStep: Chapter4MainQuestStep | null = null;

    private readonly vineLayerName = "VineShooters";
    private readonly vinePartSpacing = 30;
    private readonly vineSpeed = 300;
    private readonly vineExitSpeed = 300;
    private readonly vinePartRotationOffset = 0;
    private readonly dynamicCollisionTileId = 1;
    private readonly vineTrapPairs: ReadonlyArray<readonly [string, string]> = [
        ["1_L", "1_R"],
        ["2_L", "2_R"],
        ["3_L", "3_R"]
    ];

    private vineExitCollisionTemplate!: OrthogonalTilemap;
    private readonly vineExitCollisionLayerName = "VineExitCollisions";
    private vineExitClosing = false;


    protected readonly tilemap = {
        key: "treeInner",
        path: "/assets/tilemaps/Chapter4/TreeInner.json"
    };

    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            excaliburSprite: { key: "excalibur", path: "/assets/sprites/Excalibur.png" },
            trunkFrontSprite: { key: "trunkFront", path: "/assets/sprites/TrunkFront.png" },
            vinePartSprite: { key: "vinePart", path: "/assets/sprites/VinePart.png" },
            vinePartExitSprite: { key: "vinePartExit", path: "/assets/sprites/VinePartExit.png" }
        },
        sounds: {}
    };
    
    protected override combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), TreeInner.assetBundle);
    }
    
    protected override configureLayers(): void {
        this.getLayer("Ground").setDepth(2);
        this.getLayer("TrunkBack").setDepth(8);
        this.getLayer("Interactables").setDepth(this.actorLayerDepth);
        this.getLayer("TrunkFront").setDepth(this.actorLayerDepth);
        this.getLayer("VineShooters").setDepth(this.actorLayerDepth);

    }
    
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.destroyExitVinesWhenExitOpens();
        this.checkVineTrapTriggers();
        this.updateExcaliburPull(deltaT);
        this.updateVineAttacks(deltaT);
    }
    
    
    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        super.spawnMapObjects(tilemapData);
        this.lastChapter4QuestStep = this.storyManager.chapter4.getMainQuestStep();

        this.vineExitCollisionTemplate = this.getRequiredTilemap(this.vineExitCollisionLayerName);
        this.vineExitCollisionTemplate.visible = false;

        if (this.storyManager.chapter4.isVineExitClosed()) {
            this.applyVineExitCollision();
        }
    
        const interactLayer = tilemapData.layers.find(layer => layer.name === "Interactables");
        const excaliburPoint = interactLayer?.objects.find(obj => obj.name === "Excalibur");
    
        if (excaliburPoint) {
            const excalibur = this.add.sprite(
                this.assets.sprites.excaliburSprite.key,
                "Interactables"
            );
    
            excalibur.position.set(
                excaliburPoint.x,
                excaliburPoint.y - 10
            );
    
            excalibur.setSortTile(this.ground.getTilemapPosition(excaliburPoint.x, excaliburPoint.y));
            excalibur.setSortOrder(1);

            this.excaliburSprite = excalibur;
            this.excaliburObject = excaliburPoint;
            excalibur.alpha = 1;
        }
        
    
        const trunkFrontLayer = tilemapData.layers.find(layer => layer.name === "TrunkFront");
        const trunkFrontPoint = trunkFrontLayer?.objects.find(obj => obj.name === "TrunkFront");
    
        if (trunkFrontPoint) {
            const trunkFront = this.add.sprite(
                this.assets.sprites.trunkFrontSprite.key,
                "TrunkFront"
            );
    
            trunkFront.position.set(
                trunkFrontPoint.x,
                trunkFrontPoint.y + 30
            );
    
            trunkFront.setSortTile(this.ground.getTilemapPosition(trunkFrontPoint.x, trunkFrontPoint.y));
            trunkFront.setSortOrder(2);
        }

        const vineExitLayer = tilemapData.layers.find(layer => layer.name === "VineExit");
        this.vineExitPoints.clear();

        for (const point of vineExitLayer?.objects ?? []) {
            this.vineExitPoints.set(point.name, point);
        }

        const triggerLayer = tilemapData.layers.find(layer => layer.name === "Triggers");
        this.vineTrapObjects = triggerLayer?.objects.filter(obj => obj.name === "VineTrap") ?? [];
        this.vineTrapTiles.clear();

        for (const trap of this.vineTrapObjects) {
            for (const tile of this.getTilesCoveredByObject(trap)) {
                this.vineTrapTiles.set(this.tileKey(tile), trap);
            }
        }
    }


    private applyVineExitCollision(): void {
        const size = this.vineExitCollisionTemplate.getDimensions();
    
        for (let row = 0; row < size.y; row++) {
            for (let col = 0; col < size.x; col++) {
                const tile = this.vineExitCollisionTemplate.getTile(col, row);
    
                if (tile === 0) {
                    continue;
                }
    
                this.collision.setTile(col, row, tile);
            }
        }
    }
    
    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToGreatTree") {
            this.changeToForestSection(GreatTreeScene, "TreeOuter");
        }
    }

    protected override handleInteraction(obj: TiledObject): void {
        if (obj.name === "Excalibur") {
            this.startDialogue(
                dialogueWithChoice(
                    [
                        "A sword is buried in the trunk.",
                        "Pull out Excalibur?"
                    ],
                    {
                        lineIndex: 1,
                        options: [
                            choiceOption(
                                "Yes",
                                dialogue(
                                    ["You grip the hilt tightly."],
                                    {
                                        onComplete: () => {
                                            new Timer(0, () => this.beginPullExcalibur()).start();
                                        }
                                    }
                                )
                            ),
                            choiceOption(
                                "No",
                                dialogue(["You leave the sword where it is."])
                            )
                        ]
                    }
                )
            );
            return;
        }
    
        this.tryStartInteractionDialogue(obj);
    }


    private beginPullExcalibur(): void {
        if (this.pullingExcalibur || !this.excaliburSprite) {
            return;
        }
    
        this.pullingExcalibur = true;
        this.excaliburPullElapsed = 0;
        this.excaliburStartY = this.excaliburSprite.position.y;
    
        this.removeExcaliburInteractable();
        this.lockPlayerInput();
    }
    
    private updateExcaliburPull(deltaT: number): void {
        if (!this.pullingExcalibur || !this.excaliburSprite) {
            return;
        }
    
        this.excaliburPullElapsed += deltaT;
    
        const pullT = Math.min(this.excaliburPullElapsed / this.excaliburPullDuration, 1);
        const easedPull = Math.sin((pullT * Math.PI) / 2);
    
        this.excaliburSprite.position.y =
            this.excaliburStartY - this.excaliburPullDistance * easedPull;
    
        if (pullT > 0.25) {
            this.excaliburSprite.setSortOrder(3);
        }
    
        if (pullT < 1) {
            return;
        }
    
        const fadeElapsed = this.excaliburPullElapsed - this.excaliburPullDuration;
        const fadeT = Math.min(fadeElapsed / this.excaliburFadeDuration, 1);
    
        this.excaliburSprite.alpha = 1 - fadeT;
    
        if (fadeT >= 1) {
            this.finishPullExcalibur();
        }
    }
    
    // called when pull animation finishes
    private finishPullExcalibur(): void {
        this.pullingExcalibur = false;
    
        this.excaliburSprite?.destroy();
        this.excaliburSprite = null;
    
        this.giveExcalibur();
        this.storyManager.chapter4.markExcaliburPulled();
        this.unlockPlayerInput();
    
        this.startDialogue(dialogue(["<yellow>[You obtained Excalibur]"]));
    }
    
    // remove excalibur from scene after given to player
    private removeExcaliburInteractable(): void {
        if (!this.excaliburObject) {
            return;
        }
    
        this.interactables = this.interactables.filter(obj => obj !== this.excaliburObject);
        this.excaliburObject = null;
    }
    
    // give excalibur to the user inventory
    private giveExcalibur(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasExcalibur = inventory.find(item => item instanceof Excalibur) !== null;
    
        if (alreadyHasExcalibur) {
            return;
        }
    
        const addedItem = inventory.add(new Excalibur());
    
        if (addedItem !== null) {
            this.playItemReceivedSFX();
        }
    }
    
    private startVineAttack(startName: string, endName: string, options: VineAttackOptions = {}): void {
        const startObj = this.vineExitPoints.get(startName);
        const endObj = this.vineExitPoints.get(endName);
    
        if (!startObj || !endObj) {
            return;
        }
    
        const start = new Vec2(startObj.x, startObj.y);
        const end = new Vec2(endObj.x, endObj.y);
        const toEnd = start.vecTo(end);
        const distance = toEnd.mag();
    
        if (distance <= 0) {
            return;
        }
    
        this.activeVineAttacks.push({
            type: options.type ?? "normal",
            start,
            end,
            direction: toEnd.normalize(),
            distance,
            speed: options.speed ?? this.vineSpeed,
            spriteKey: options.spriteKey ?? this.assets.sprites.vinePartSprite.key,
            progress: 0,
            parts: [],
            blockedTiles: [],
            blocksTiles: options.blocksTiles ?? false
        });
    }

    

    private findVineTrapAtTile(tile: Vec2 | null): TiledObject | undefined {
        if (!tile) {
            return undefined;
        }

        return this.vineTrapTiles.get(this.tileKey(tile));
    }

    private checkVineTrapTriggers(): void {
        if (!this.storyManager.chapter4.canTriggerVineExitClose()) {
            return;
        }

        if (this.vineExitClosing) {
            return;
        }

        const ai = this.player.ai as PlayerAI;
        const trap = this.findVineTrapAtTile(ai.targetTile) ?? this.findVineTrapAtTile(ai.currentTile);

        if (!trap) {
            return;
        }

        const trapKey = `${trap.name}:${trap.x},${trap.y}`;

        if (this.triggeredVineTraps.has(trapKey)) {
            return;
        }

        this.triggeredVineTraps.add(trapKey);

        if (ai.moving) {
            const previousOnMoveComplete = ai.onMoveComplete;
            ai.onMoveComplete = () => {
                previousOnMoveComplete?.();
                this.lockPlayerInput();
                new Timer(0, () => this.activateVineTrap()).start();
            };
            return;
        }

        this.activateVineTrap();
    }

    private async activateVineTrap(): Promise<void> {
        if (this.vineExitClosing) {
            return;
        }
    
        this.vineExitClosing = true;
        this.lockPlayerInput();
    
        for (const [startName, endName] of this.vineTrapPairs) {
            this.startVineAttack(startName, endName, {
                type: "exit",
                speed: this.vineExitSpeed,
                spriteKey: this.assets.sprites.vinePartExitSprite.key
            });
        }
    
        await this.movePlayerOneTileBackwardAsync({ ignoreCollision: true });
    
        this.applyVineExitCollision();
        this.storyManager.chapter4.markVineExitClosed();

        this.startDialogue(dialogue([
            "The Vines blocked the way out..."
        ]));
    }

    private destroyExitVinesWhenExitOpens(): void {
        const currentStep = this.storyManager.chapter4.getMainQuestStep();

        if (this.lastChapter4QuestStep === currentStep) {
            return;
        }

        this.lastChapter4QuestStep = currentStep;

        if (currentStep === Chapter4MainQuestStep.VINE_EXIT_OPEN) {
            this.destroyVineAttacks(attack => attack.type === "exit");
        }
    }

    private destroyVineAttacks(shouldDestroy: (attack: VineAttack) => boolean): void {
        const remainingAttacks: VineAttack[] = [];

        for (const attack of this.activeVineAttacks) {
            if (!shouldDestroy(attack)) {
                remainingAttacks.push(attack);
                continue;
            }

            for (const part of attack.parts) {
                part.destroy();
            }

            this.unblockDynamicCollisionTiles(attack.blockedTiles);
        }

        this.activeVineAttacks = remainingAttacks;
    }
    
    
    private updateVineAttacks(deltaT: number): void {
        for (const attack of this.activeVineAttacks) {
            if (attack.progress >= attack.distance) {
                continue;
            }
    
            attack.progress = Math.min(
                attack.progress + attack.speed * deltaT,
                attack.distance
            );

            this.ensureVinePartCount(attack);
            this.positionVineParts(attack);

            if (attack.blocksTiles) {
                this.blockTilesCrossedByVine(attack);
            }
        }
    }
    
    private ensureVinePartCount(attack: VineAttack): void {
        const neededParts = Math.ceil(attack.progress / this.vinePartSpacing);
    
        while (attack.parts.length < neededParts) {
            const part = this.add.sprite(
                attack.spriteKey,
                this.vineLayerName
            );
    
            part.alpha = 1;
            part.setSortOrder(4);
            attack.parts.push(part);
        }
    }
    
    private positionVineParts(attack: VineAttack): void {
        const angle = Math.atan2(attack.direction.y, attack.direction.x);
    
        for (let i = 0; i < attack.parts.length; i++) {
            const part = attack.parts[i];
            const partDistance = attack.progress - i * this.vinePartSpacing;
    
            if (partDistance < 0) {
                part.visible = false;
                continue;
            }
    
            const visibleLength = Math.min(this.vinePartSpacing, partDistance);
            const visibleRatio = visibleLength / this.vinePartSpacing;
            const centerDistance = partDistance - visibleLength / 2;

            part.visible = true;
            part.scale.set(visibleRatio, 1);

            part.position.set(
                attack.start.x + attack.direction.x * centerDistance,
                attack.start.y + attack.direction.y * centerDistance
            );
    
            part.rotation = -angle + this.vinePartRotationOffset;
            part.setSortTile(this.ground.getTilemapPosition(part.position.x, part.position.y));
        }
    }

    // Add collision to anytile that the vine has crossed
    private blockTilesCrossedByVine(attack: VineAttack): void {
        const currentTip = new Vec2(
            attack.start.x + attack.direction.x * attack.progress,
            attack.start.y + attack.direction.y * attack.progress
        );
        const crossedTiles = this.getTilesCrossedByWorldSegment(attack.start, currentTip);
        const alreadyBlockedByAttack = new Set(attack.blockedTiles.map(tile => this.tileKey(tile)));

        for (const tile of crossedTiles) {
            if (alreadyBlockedByAttack.has(this.tileKey(tile))) {
                continue;
            }

            this.blockDynamicCollisionTile(tile);
            attack.blockedTiles.push(tile.clone());
        }
    }

    private getTilesCrossedByWorldSegment(start: Vec2, end: Vec2): Vec2[] {
        const distance = start.distanceTo(end);
        const tileSize = this.ground.getScaledTileSize();
        const sampleSpacing = Math.max(1, Math.min(tileSize.x, tileSize.y) / 4);
        const sampleCount = Math.max(1, Math.ceil(distance / sampleSpacing));
        const tiles = new Map<string, Vec2>();

        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            const point = Vec2.lerp(start, end, t);
            const tile = this.ground.getTilemapPosition(point.x, point.y);
            tiles.set(this.tileKey(tile), tile);
        }

        return Array.from(tiles.values());
    }

    private blockDynamicCollisionTile(tile: Vec2): void {
        const key = this.tileKey(tile);
        const existing = this.dynamicCollisionTiles.get(key);

        if (existing) {
            existing.count += 1;
            return;
        }

        const previousTile = this.collision.getTile(tile.x, tile.y);

        if (previousTile === -1) {
            return;
        }

        this.dynamicCollisionTiles.set(key, {
            tile: tile.clone(),
            previousTile,
            count: 1
        });
        this.collision.setTile(tile.x, tile.y, this.dynamicCollisionTileId);
    }

    private unblockDynamicCollisionTiles(tiles: Vec2[]): void {
        for (const tile of tiles) {
            this.unblockDynamicCollisionTile(tile);
        }
    }

    private unblockDynamicCollisionTile(tile: Vec2): void {
        const key = this.tileKey(tile);
        const existing = this.dynamicCollisionTiles.get(key);

        if (!existing) {
            return;
        }

        existing.count -= 1;

        if (existing.count > 0) {
            return;
        }

        this.collision.setTile(existing.tile.x, existing.tile.y, existing.previousTile);
        this.dynamicCollisionTiles.delete(key);
    }

    private tileKey(tile: Vec2): string {
        return `${tile.x},${tile.y}`;
    }
    
}
