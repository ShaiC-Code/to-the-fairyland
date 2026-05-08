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

    protected giveFreshPrettyTooth(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasTooth = inventory.find(item => item instanceof FreshPrettyTooth) !== null;
    
        if (!alreadyHasTooth) {
            inventory.add(new FreshPrettyTooth());
            this.playItemReceivedSFX();
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.FRESH_PRETTY_TOOTH);

    }
    
    protected giveFlowerRing(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasFlowerRing = inventory.find(item => item instanceof FlowerRing) !== null;
    
        if (!alreadyHasFlowerRing) {
            inventory.add(new FlowerRing());
            this.playItemReceivedSFX();
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.FLOWER_RING);
    }

    protected giveLoftyBread(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasLoftyBread = inventory.find(item => item instanceof LoftyBread) !== null;

        if (!alreadyHasLoftyBread) {
            inventory.add(new LoftyBread());
            this.playItemReceivedSFX();
        }

        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.LOFTY_BREAD);
    }

    protected giveSleepingBag(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasSleepingBag = inventory.find(item => item instanceof SleepingBag) !== null;
    
        if (!alreadyHasSleepingBag) {
            inventory.add(new SleepingBag());
            this.playItemReceivedSFX();
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.SLEEPING_BAG);
    }

    protected giveObsidianBoots(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasObsidianBoots = inventory.find(item => item instanceof ObsidianBoots) !== null;
    
        if (!alreadyHasObsidianBoots) {
            inventory.add(new ObsidianBoots());
            this.playItemReceivedSFX();
        }
    
        this.storyManager.chapter2.markVillageItemReceived(Chapter2VillageItem.OBSIDIAN_BOOTS);
    }

    protected canUseSleepingBagHere(): boolean {
        return false;
    }
    
    protected override previewItemAction(action: ItemUseAction): ItemUseResult {
        if (action === ItemUseActions.SLEEP_WITH_SLEEPING_BAG) {
            return this.previewSleepWithSleepingBag();
        }
    
        return super.previewItemAction(action);
    }
    
    protected override runItemAction(action: ItemUseAction): ItemUseResult {
        if (action === ItemUseActions.SLEEP_WITH_SLEEPING_BAG) {
            return this.sleepWithSleepingBag();
        }
    
        return super.runItemAction(action);
    }
    
    private previewSleepWithSleepingBag(): ItemUseResult {
        if (!this.canUseSleepingBagHere()) {
            return {
                success: false,
                lines: ["This is not a safe place to sleep."]
            };
        }
    
        if (!this.storyManager.chapter2.canSleepOnRoad()) {
            return {
                success: false,
                lines: ["It is not time to sleep yet."]
            };
        }
    
        return {
            success: true,
            lines: ["You rest for a while."]
        };
    }
    
    private sleepWithSleepingBag(): ItemUseResult {
        const result = this.previewSleepWithSleepingBag();
    
        if (!result.success) {
            return result;
        }
    
        const worldState = this.gameSessionManager.getWorldState();
    
        worldState.timeOfDay =
            worldState.timeOfDay === TimeOfDay.DAY
                ? TimeOfDay.NIGHT
                : TimeOfDay.DAY;
    
        this.timeController.setTimeOfDay(worldState.timeOfDay);
        this.storyManager.chapter2.markSleptOnRoad();
    
        return result;
    }
}
