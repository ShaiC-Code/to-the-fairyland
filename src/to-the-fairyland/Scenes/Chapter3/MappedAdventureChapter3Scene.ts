import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueCompleteActions, DialogueChoiceActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import FreshPrettyTooth from "../../GameSystems/ItemSystem/Items/FreshPrettyTooth";
import FlowerRing from "../../GameSystems/ItemSystem/Items/FlowerRing";
import LoftyBread from "../../GameSystems/ItemSystem/Items/LoftyBread";
import { Chapter2VillageItem } from "../../GameSystems/StorySystem/StoryState";
import SleepingBag from "../../GameSystems/ItemSystem/Items/SleepingBag";
import ObsidianBoots from "../../GameSystems/ItemSystem/Items/ObsidianBoots";
import { ItemUseAction, ItemUseActions, ItemUseResult } from "../../GameSystems/ItemSystem/ItemUseActions";
import { TimeOfDay } from "../../GameSystems/WorldSystem/WorldState";
import AudioController from "../../GameSystems/AudioController";
import DesertLandScene from "../Chapter4/DesertLandScene";

export default abstract class MappedAdventureChapter3Scene extends MappedAdventureScene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            forestTreeSprite: { key: "forestTree1", path: "/assets/sprites/ForestTree1.png" }
        },
        sounds: {},
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {},
        dialogueChoiceActionHandlers: {}
    };
    
    protected readonly storyManager = StoryManager.getInstance();

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), MappedAdventureChapter3Scene.assetBundle);
    }

    public override unloadScene(): void {
        super.unloadScene();
        this.keepAssets(MappedAdventureChapter3Scene.assetBundle);
    }
        
    protected gotoChapter4(): void {
        this.storyManager.unlockChapter4();
        this.sceneManager.changeToScene(
            DesertLandScene,
            {
                cheatsEnabled: this.cheatsEnabled,
                spawnName: "RoadStart"
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
