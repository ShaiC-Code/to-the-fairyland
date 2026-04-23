import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueCompleteActions, DialogueChoiceActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import EndOfDemoScene from "./EndOfDemoScene";
import FreshPrettyTooth from "../../GameSystems/ItemSystem/Items/FreshPrettyTooth";
import FlowerRing from "../../GameSystems/ItemSystem/Items/FlowerRing";
import { Chapter2VillageItem } from "../../GameSystems/StorySystem/StoryState";



export default abstract class MappedAdventureChapter2Scene extends MappedAdventureScene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {
            walkingSnowSFX: { key: "walking-snow", path: "/assets/sounds/walking-snow.ogg" },
            walkingWoodSFX: { key: "walking-wood", path: "/assets/sounds/walking-wood.ogg" },
            walkingSnowBushSFX: { key: "walking-snow-bush", path: "/assets/sounds/walking-snow-bush.ogg" }
        }
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {
            [DialogueCompleteActions.GIVE_FLOWER_RING]: () => this.giveFlowerRing()
        },
        dialogueChoiceActionHandlers: {
            [DialogueChoiceActions.TAKE_FRESH_PRETTY_TOOTH]: () => this.giveFreshPrettyTooth()
        }
    };
    

    protected readonly storyManager = StoryManager.getInstance();

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), MappedAdventureChapter2Scene.assetBundle);
    }

    public override unloadScene(): void {
        super.unloadScene();
        this.keepAssets(MappedAdventureChapter2Scene.assetBundle);
    }

    protected gotoChapter3(): void {
        this.sceneManager.changeToScene(
            EndOfDemoScene,
            undefined,
            undefined,
            {
                useFadeTransition: true,
                fadeOutMs: 2000,
                fadeInMs: 2000
            }
        );
    }

    protected giveFreshPrettyTooth(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasTooth = inventory.find(item => item instanceof FreshPrettyTooth) !== null;
    
        if (!alreadyHasTooth) {
            inventory.add(new FreshPrettyTooth());
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.FRESH_PRETTY_TOOTH);

    }
    
    protected giveFlowerRing(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasFlowerRing = inventory.find(item => item instanceof FlowerRing) !== null;
    
        if (!alreadyHasFlowerRing) {
            inventory.add(new FlowerRing());
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.FLOWER_RING);
    }
}
