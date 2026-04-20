import MappedAdventureScene, { AssetBundle, ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueChoiceActions, DialogueReadActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import EndOfDemoScene from "./EndOfDemoScene";

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
        dialogueReadActionHandlers: {},
        dialogueChoiceActionHandlers: {}
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
}
