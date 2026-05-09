import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueCompleteActions, DialogueChoiceActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import DesertLandScene from "../Chapter4/DesertLandScene";
import AmbienceController from "../../GameSystems/WorldSystem/AmbienceController";
import { TimeOfDay } from "../../GameSystems/WorldSystem/WorldState";

export default abstract class MappedAdventureChapter3Scene extends MappedAdventureScene {
    protected static readonly assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {
            bushBerriesSprite: { key: "bushBerries", path: "/assets/sprites/BushBerries.png" },
            forestTreeSprite: { key: "forestTree1", path: "/assets/sprites/ForestTree1.png" }
        },
        sounds: {
            forestDayAmbienceSFX: { key: "ambience-forest-day", path: "/assets/sounds/ambience-forest-day.ogg" },
            forestNightAmbienceSFX: { key: "ambience-forest-night", path: "/assets/sounds/ambience-forest-night.ogg" }
        },
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
        this.transitioning = true;
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
        
    protected playCurrentAmbience(): void {
    //     if (this.gameSessionManager.getWorldState().timeOfDay === TimeOfDay.DAY) {
    //         AmbienceController.getInstance().playAmbience(this.ambienceChannel, this.assets.sounds.forestDayAmbienceSFX.key);
    //     } else {
    //         AmbienceController.getInstance().playAmbience(this.ambienceChannel, this.assets.sounds.forestNightAmbienceSFX.key);
    //     }
    }
}
