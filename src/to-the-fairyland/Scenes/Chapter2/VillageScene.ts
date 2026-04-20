import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../../Actors/NPCActor";
import IdleBehavior from "../../AI/NPC/NPCBehavior/IdleBehavior";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter2Scene from "./MappedAdventureChapter2Scene";
import RoadScene from "./RoadScene";

export default class VillageScene extends MappedAdventureChapter2Scene {
    protected readonly tilemap = {
        key: "village",
        path: "/assets/tilemaps/Chapter2/Village.json"
    };
        
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {
            village: { key: "village", path: "/assets/tilemaps/Chapter2/Village.json" }
        },
        spritesheets: {
            NPC1: { key: "npc1", path: "/assets/spritesheets/NPC1.json" },
            NPC2: { key: "npc2", path: "/assets/spritesheets/NPC2.json" },
            NPC3: { key: "npc3", path: "/assets/spritesheets/NPC3.json" },
            NPC4: { key: "npc4", path: "/assets/spritesheets/NPC4.json" },
            NPC5: { key: "npc5", path: "/assets/spritesheets/NPC5.json" },
        },
        sprites: {},
        sounds: {}
    };

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), VillageScene.assetBundle);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
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

        // Align the sprite so its feet rest on the marker tile.
        npc.position.set(tileCenter.x, tileCenter.y - npc.size.y / 2 + 25);
        npc.setSortTile(tile);
        npc.setSortOrder(0);

        npc.animation.play("IDLE_DOWN", true);
        npc.addAI(IdleBehavior, {});
    }

    protected override handleAutoTransition(obj: TiledObject): void {
        if (obj.name === "PathToAdventure") {
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