import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { TiledObject, TiledTilemapData } from "../../../Wolfie2D/DataTypes/Tilesets/TiledData";
import NPCActor from "../../Actors/NPCActor";
import IdleBehavior from "../../AI/NPC/NPCBehavior/IdleBehavior";
import { AssetBundle } from "../MappedAdventureScene";
import MappedAdventureChapter2Scene from "./MappedAdventureChapter2Scene";
import RoadScene from "./RoadScene";
import PlayerAI from "../../AI/Player/PlayerAI";
import { PlayerStateType } from "../../AI/Player/PlayerStates/PlayerBehaviorState";
import { dialogue, getNpcInteraction } from "../../GameSystems/InteractionSystem/InteractionDatabase";


type NpcRuntime = {
    name: string;
    actor: NPCActor;
};

export default class VillageScene extends MappedAdventureChapter2Scene {
    private npcs: NpcRuntime[] = [];

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
            Lucy: { key: "Lucy", path: "/assets/spritesheets/Lucy.json" }
        },
        sprites: {},
        sounds: {}
    };

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), VillageScene.assetBundle);
    }

    protected override spawnMapObjects(tilemapData: TiledTilemapData): void {
        this.npcs = [];

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
                this.transitioning = false;
                this.rejectAdventurePathEntry();
    
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

    private rejectAdventurePathEntry(): void {
        const ai = this.player.ai as PlayerAI;
    
        const safeTile = ai.currentTile.clone();
        const blockedDirection = ai.targetTile
            ? ai.targetTile.clone().sub(ai.currentTile)
            : ai.facing.clone();
    
        const bounceDirection = blockedDirection.scaled(-1);
        const bounceTile = safeTile.clone().add(bounceDirection);
    
        const safeTileCenter = this.ground.getTileCenter(safeTile.x, safeTile.y);
        const safePosition = this.player.getCenterForFeetPosition(
            safeTileCenter.x,
            safeTileCenter.y
        );
    
        this.player.position.copy(safePosition);
    
        ai.currentTile = safeTile;
        ai.targetTile = null;
        ai.moving = false;
        ai.moveProgress = 0;
        ai.moveStart = safePosition.clone();
        ai.moveEnd = safePosition.clone();
    
        if (!ai.canMoveToTile(safeTile, bounceDirection)) {
            ai.facing = bounceDirection;
            this.player.setSortTile(safeTile);
            ai.changeState(PlayerStateType.IDLE);
            return;
        }
    
        const bounceTileCenter = this.ground.getTileCenter(bounceTile.x, bounceTile.y);
        const bouncePosition = this.player.getCenterForFeetPosition(
            bounceTileCenter.x,
            bounceTileCenter.y
        );
    
        ai.facing = bounceDirection;
        ai.targetTile = bounceTile;
        ai.moveEnd = bouncePosition;
        ai.currentMoveDuration = ai.moveDuration;
        ai.moving = true;
    
        this.player.setSortTile(bounceTile);
        ai.changeState(PlayerStateType.MOVING);
    }
    
    
}
