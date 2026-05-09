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
import CliffBottomScene from "../Chapter3/CliffBottomScene";
import AmbienceController from "../../GameSystems/WorldSystem/AmbienceController";
import { AudioChannelType } from "../../../Wolfie2D/Sound/AudioManager";

export default abstract class MappedAdventureChapter2Scene extends MappedAdventureScene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {
            somethingBigSFX: { key: "something-big", path: "/assets/sounds/something-big.ogg" },
            forestDayAmbienceSFX: { key: "ambience-forest-day", path: "/assets/sounds/ambience-forest-day.ogg" },
            forestNightAmbienceSFX: { key: "ambience-forest-night", path: "/assets/sounds/ambience-forest-night.ogg" }
        },
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {
            [DialogueCompleteActions.GIVE_FLOWER_RING]: () => this.giveFlowerRing(),
            [DialogueCompleteActions.GIVE_OBSIDIAN_BOOTS]: () => this.giveObsidianBoots()
        },
        dialogueChoiceActionHandlers: {
            [DialogueChoiceActions.TAKE_FRESH_PRETTY_TOOTH]: () => this.giveFreshPrettyTooth(),
            [DialogueChoiceActions.TAKE_LOFTY_BREAD]: () => this.giveLoftyBread(),
            [DialogueChoiceActions.TAKE_SLEEPING_BAG]: () => this.giveSleepingBag()
        }
    };
    
    protected readonly storyManager = StoryManager.getInstance();

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), MappedAdventureChapter2Scene.assetBundle);
    }

    public override startScene(): void {
        super.startScene();
        this.playCurrentAmbience();
    }

    public override unloadScene(): void {
        super.unloadScene();
        this.keepAssets(MappedAdventureChapter2Scene.assetBundle);
    }
    
    protected gotoChapter3(): void {
        this.playerStateManager.setHealth(1);
        this.storyManager.unlockChapter3();
        this.sceneManager.changeToScene(
            CliffBottomScene,
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
        this.storyManager.chapter2.markSleepOnRoad();
    
        return result;
    }
    
    protected playCurrentAmbience(): void {
        const ambienceChannel = AudioChannelType.CUSTOM_2;
        if (this.gameSessionManager.getWorldState().timeOfDay === TimeOfDay.DAY) {
            AmbienceController.getInstance().playAmbience(ambienceChannel, this.assets.sounds.forestDayAmbienceSFX.key);
        } else {
            AmbienceController.getInstance().playAmbience(ambienceChannel, this.assets.sounds.forestNightAmbienceSFX.key);
        }
    }
}
