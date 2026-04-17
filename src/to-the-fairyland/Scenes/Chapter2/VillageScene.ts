import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../../Actors/NPCActor";
import IdleBehavior from "../../AI/NPC/NPCBehavior/IdleBehavior";
import MappedAdventureScene from "../MappedAdventureScene";

type NpcSheetRef = Readonly<{
    key: string;
    path: string;
}>;

export default class VillageScene extends MappedAdventureScene {
    protected readonly tilemap = {
        key: "village",
        path: "/assets/tilemaps/Chapter2/Village.json"
    };

    private readonly npcSheets: Readonly<Record<string, NpcSheetRef>> = {
        NPC1: { key: "npc1", path: "/assets/spritesheets/NPC1.json" },
        NPC2: { key: "npc2", path: "/assets/spritesheets/NPC2.json" },
        NPC3: { key: "npc3", path: "/assets/spritesheets/NPC3.json" },
        NPC4: { key: "npc4", path: "/assets/spritesheets/NPC4.json" },
        NPC5: { key: "npc5", path: "/assets/spritesheets/NPC5.json" },
        NPC6: { key: "npc6", path: "/assets/spritesheets/NPC6.json" },
        NPC7: { key: "npc7", path: "/assets/spritesheets/NPC7.json" }
    };

    protected override loadExtraAssets(): void {
        this.loadMissingSpritesheets(Object.values(this.npcSheets));
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        const npcLayer = tilemapData.layers.find(layer => layer.name === "NPCs");
        const npcPoints = npcLayer?.objects ?? [];

        for (const obj of npcPoints) {
            this.spawnNpc(obj);
        }
    }

    private spawnNpc(obj: TiledObject): void {
        const sheet = this.npcSheets[obj.name];

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

}