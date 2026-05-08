import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueChoiceActions, DialogueCompleteActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import FrozenBerries from "../../GameSystems/ItemSystem/Items/FrozenBerries";
import CookedBerries from "../../GameSystems/ItemSystem/Items/CookedBerries";
import WorldMap from "../../GameSystems/ItemSystem/Items/WorldMap";
import VillageScene from "../Chapter2/VillageScene";
import AudioController from "../../GameSystems/AudioController";

export default abstract class MappedAdventureChapter1Scene extends MappedAdventureScene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            snowFlake1Sprite: { key: "snowflake1", path: "/assets/sprites/particles/SnowFlake1.png" },
            snowFlake2Sprite: { key: "snowflake2", path: "/assets/sprites/particles/SnowFlake2.png" },
            snowFlake3Sprite: { key: "snowflake3", path: "/assets/sprites/particles/SnowFlake3.png" }
        },
        sounds: {
            walkingSnowSFX: { key: "walking-snow", path: "/assets/sounds/walking-snow.ogg" },
            walkingWoodSFX: { key: "walking-wood", path: "/assets/sounds/walking-wood.ogg" },
            walkingSnowBushSFX: { key: "walking-snow-bush", path: "/assets/sounds/walking-snow-bush.ogg" },
            weatherSnowSFX: { key: "weather-snow", path: "/assets/sounds/weather-snow.ogg" },
            weatherSnowStormSFX: { key: "weather-snowstorm", path: "/assets/sounds/weather-snowstorm.ogg" },
            wolvesHowlingSFX: { key: "wolves-howling", path: "/assets/sounds/wolves-howling.ogg" }
        },
        images: {}
    };

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueCompleteActionHandlers: {
            [DialogueCompleteActions.GOTO_CHAPTER2]: () => this.gotoChapter2()
        },
        dialogueChoiceActionHandlers: {
            [DialogueChoiceActions.COLLECT_FROZEN_BERRIES]: () => this.giveFrozenBerries(),
            [DialogueChoiceActions.COOK_FROZEN_BERRIES]: () => this.giveCookedBerries(),
            [DialogueChoiceActions.SLEEP]: () => {
                this.storyManager.chapter1.markSlept();
                this.timeController.setTimeOfDay(this.gameSessionManager.getWorldState().timeOfDay);
            },
            [DialogueChoiceActions.PICKUP_MAP]: () => this.pickupMap()
        }
    };
    
    protected readonly storyManager = StoryManager.getInstance();

    protected combinedAssetBundles(): AssetBundle {
        return this.mergeAssetBundles(super.combinedAssetBundles(), MappedAdventureChapter1Scene.assetBundle);
    }

    public override unloadScene(): void {
        super.unloadScene();
        this.keepAssets(MappedAdventureChapter1Scene.assetBundle);

        // Stop sfx when changing scenes
        AudioController.getInstance().stopSound(this.assets.sounds.walkingWoodSFX.key);
        AudioController.getInstance().stopSound(this.assets.sounds.walkingSnowSFX.key);
        AudioController.getInstance().stopSound(this.assets.sounds.walkingSnowBushSFX.key);
    }

    protected gotoChapter2(): void {
        this.storyManager.unlockChapter2();
        this.sceneManager.changeToScene(
            VillageScene,
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

    protected onMapPickedUp(): void {}

    protected giveFrozenBerries(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasBerries = inventory.find(item => item instanceof FrozenBerries) !== null;

        if (alreadyHasBerries) {
            return;
        }

        const berries = new FrozenBerries(1);
        const addedItem = inventory.add(berries);
        this.playItemReceivedSFX();

        if (addedItem !== null) {
            this.storyManager.chapter1.markFoodFound();
        }
    }

    protected giveCookedBerries(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const frozenBerries = inventory.find(item => item instanceof FrozenBerries) as FrozenBerries | null;

        if (!frozenBerries) {
            return;
        }

        inventory.remove(frozenBerries.id);
        const berries = new CookedBerries(1);
        const addedItem = inventory.add(berries);
        this.playItemReceivedSFX();

        if (addedItem !== null) {
            this.storyManager.chapter1.markFoodCooked();
        }
    }

    protected pickupMap(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasMap = inventory.find(item => item instanceof WorldMap) !== null;

        if (alreadyHasMap) {
            return;
        }

        const map = new WorldMap();
        const addedItem = inventory.add(map);
        this.playItemReceivedSFX();

        if (addedItem !== null) {
            this.storyManager.chapter1.markMapPickedUp();
            this.onMapPickedUp();
        }
    }
}
