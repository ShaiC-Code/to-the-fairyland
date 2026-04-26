import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../../Actors/NPCActor";
import IdleBehavior from "../../AI/NPC/NPCBehavior/IdleBehavior";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter2Scene from "./MappedAdventureChapter2Scene";
import RoadScene from "./RoadScene";
import { dialogue, getNpcInteraction } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import ScrollingPatternWorldLayer from "../../Overlays/ScrollingPatternWorldLayer";
import LycanChaseBehavior from "../../AI/NPC/NPCBehavior/LycanChaseBehavior";


type NpcRuntime = {
    name: string;
    actor: NPCActor;
};

export default class VillageScene extends MappedAdventureChapter2Scene {
    private npcs: NpcRuntime[] = [];
    private lycans: NPCActor[] = [];
    
    private readonly lycanDetectionRadius = 320;
    private readonly lycanRepathInterval = 0.25;
    private readonly lycanFeetOffsetY = 15;

    private readonly lycanMoveDuration = 0.16;
    private readonly lycanBoostMoveDuration = 0.08;
    private readonly lycanBoostChance = 0.15;
    private readonly lycanBoostMinSteps = 2;
    private readonly lycanBoostMaxSteps = 5;
    private readonly lycanBoostLocksDirection = true;
    
    protected readonly tilemap = {
        key: "village",
        path: "/assets/tilemaps/Chapter2/Village.json"
    };
        
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            village: { key: "village", path: "/assets/tilemaps/Chapter2/Village.json" }
        },
        spritesheets: {
            K: { key: "K", path: "/assets/spritesheets/K.json" },
            J: { key: "J", path: "/assets/spritesheets/J.json" },
            Argus: { key: "Argus", path: "/assets/spritesheets/Argus.json" },
            Vila: { key: "Vila", path: "/assets/spritesheets/Vila.json" },
            Lucy: { key: "Lucy", path: "/assets/spritesheets/Lucy.json" },
            Lycan: { key: "Lycan", path: "/assets/spritesheets/Lycan.json" }
        },
        sprites: {
            bloodMist: { key: "bloodMist", path: "/assets/sprites/overlays/bloodmist.png" }
        },
        sounds: {}
    };
 
    protected readonly bloodMistEffectLayerName = "bloodMistTintLayer";
    protected bloodMistEffectLayer!: ScrollingPatternWorldLayer;


    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), VillageScene.assetBundle);
    }

    public override startScene(): void {
        super.startScene();
    
        this.bloodMistEffectLayer = new ScrollingPatternWorldLayer(
            this.bloodMistEffectLayerName,
            this,
            this.viewport,
            {
                imageKey: this.assets.sprites.bloodMist.key,
                depth: 50,
                speed: 20,
                direction: new Vec2(-1, 0.33),
                scale: 1.0,
                alpha: 0.4
            }
        );
        
        if (this.storyManager.chapter2.needsToCheckVillage()) {
            this.bloodMistEffectLayer.show();
        }
    }
    
    public override updateScene(deltaT: number): void {
        super.updateScene(deltaT);
        this.updateLycanDetection();
        if (this.bloodMistEffectLayer) {
            this.bloodMistEffectLayer.update(deltaT);
        }
    }    

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        this.npcs = [];
        this.lycans = [];

        if (this.storyManager.chapter2.needsToCheckVillage()) {
            this.spawnCheckVillageLycans(tilemapData);
            return;
        }

        const npcLayer = tilemapData.layers.find(layer => layer.name === "NPCs");
        const npcPoints = npcLayer?.objects ?? [];

        for (const obj of npcPoints) {
            this.spawnNPC(obj);
        }
    }

    private spawnNPC(obj: TiledObject): void {
        const sheet = this.assets.spritesheets[obj.name];

        if (!sheet) {
            console.warn(`VillageScene: no NPC spritesheet configured for "${obj.name}"`);
            return;
        }

        const npc = this.add.animatedSprite(NPCActor, sheet.key, this.actorLayerName);

        const tile = this.getObjectTile(obj);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);

        npc.position.set(tileCenter.x, tileCenter.y - npc.size.y / 2 + 25);
        npc.setSortTile(tile);
        npc.setSortOrder(0);

        npc.animation.play("IDLE_DOWN", true);
        npc.addAI(IdleBehavior, {});

        this.npcs.push({
            name: obj.name,
            actor: npc
        });
    }

    private spawnCheckVillageLycans(tilemapData: TiledTilemapData): void {
        const lycanLayer = tilemapData.layers.find(layer => layer.name === "EnemySpawns");
        const lycanPoints = lycanLayer?.objects ?? [];
    
        for (const obj of lycanPoints) {
            this.spawnLycan(obj);
        }
    }
    
    private spawnLycan(obj: TiledObject): void {
        const lycan = this.add.animatedSprite(
            NPCActor,
            this.assets.spritesheets.Lycan.key,
            this.actorLayerName
        );
    
        const scale = 1.25;
        lycan.scale.set(scale, scale);
        
        const tile = this.getObjectTile(obj);
        const tileCenter = this.ground.getTileCenter(tile.x, tile.y);
    
        lycan.position.set(tileCenter.x, tileCenter.y - lycan.size.y / 2 + 15);
        lycan.setSortTile(tile);
        lycan.setSortOrder(10);
    
        const facing = obj.properties?.find(prop => prop.name === "facing")?.value;
        lycan.animation.play(this.getIdleAnimationForFacing(facing), true);
    
        lycan.addAI(IdleBehavior, {});
        this.lycans.push(lycan);
    }

    private updateLycanDetection(): void {
        if (
            !this.storyManager.chapter2.needsLycanDetection() ||
            this.worldPaused ||
            this.dialogueController.isActive
        ) {
            return;
        }
    
        const detectionRadiusSq = this.lycanDetectionRadius * this.lycanDetectionRadius;
    
        const detectedLycan = this.lycans.find(lycan =>
            lycan.position.distanceSqTo(this.player.position) <= detectionRadiusSq
        );
    
        if (!detectedLycan) {
            return;
        }
    
        this.storyManager.chapter2.markDetectedByLycans();
        this.startLycanChase(detectedLycan);
    }

    private startLycanChase(detectedLycan: NPCActor): void {
        console.log("Detected by Lycan:", detectedLycan.id);
    
        this.storyManager.chapter2.markEscapeLycansStarted();
    
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
                boostLocksDirection: this.lycanBoostLocksDirection
            });
        }
    }
    
    private getIdleAnimationForFacing(facing: string | undefined): string {
        if (facing === "up") return "IDLE_UP";
        if (facing === "left") return "IDLE_LEFT";
        if (facing === "right") return "IDLE_RIGHT";
        return "IDLE_DOWN";
    }
    

    protected override tryStartSceneInteractionAtTile(tile: Vec2): boolean {
        const npc = this.findNpcAtTile(tile);
        if (!npc) {
            return false;
        }

        const interaction = getNpcInteraction(npc.name, {
            chapter2: this.storyManager.getStoryState().chapter2
        });
        if (!interaction) {
            return false;
        }

        this.startDialogue(interaction, npc.name);
        return true;
    }

    private findNpcAtTile(tile: Vec2): NpcRuntime | undefined {
        return this.npcs.find(npc => {
            const npcTile = npc.actor.getSortTile();
            return npcTile !== null && npcTile.x === tile.x && npcTile.y === tile.y;
        });
    }

    protected override handleInteraction(obj: TiledObject): void {
        this.tryStartInteractionDialogue(obj);
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToAdventure") {
            if (!this.storyManager.chapter2.canLeaveVillage()) {
                this.rejectAutoTransitionEntry();
    
                this.startDialogue(
                    dialogue([
                        "You felt like you forgot something.",
                        "There may still be things here that matter."
                    ])
                );
    
                return;
            }
            this.sceneManager.changeToScene(
                RoadScene,
                { spawnName: "RoadStart" },
                undefined,
                {
                    useFadeTransition: true,
                    fadeOutMs: 300,
                    fadeInMs: 300
                }
            );
        }
    }
    
}
