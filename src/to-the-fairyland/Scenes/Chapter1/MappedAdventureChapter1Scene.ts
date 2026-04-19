import MappedAdventureScene, { ChapterSceneDefinition } from "../MappedAdventureScene";
import StoryManager from "../../GameSystems/StorySystem/StoryManager";
import { DialogueChoiceActions, DialogueReadActions } from "../../GameSystems/InteractionSystem/InteractionDatabase";
import FrozenBerries from "../../GameSystems/ItemSystem/Items/FrozenBerries";
import CookedBerries from "../../GameSystems/ItemSystem/Items/CookedBerries";
import WorldMap from "../../GameSystems/ItemSystem/Items/WorldMap";
import EndOfDemoScene from "../Chapter2/EndOfDemoScene";

export default abstract class MappedAdventureChapter1Scene extends MappedAdventureScene {
    protected readonly storyManager = StoryManager.getInstance();

    protected readonly chapterDefinition: ChapterSceneDefinition = {
        dialogueReadActionHandlers: {
            [DialogueReadActions.GOTO_CHAPTER2]: () => this.gotoChapter2()
        },
        dialogueChoiceActionHandlers: {
            [DialogueChoiceActions.COLLECT_FROZEN_BERRIES]: () => this.giveFrozenBerries(),
            [DialogueChoiceActions.COOK_FROZEN_BERRIES]: () => this.giveCookedBerries(),
            [DialogueChoiceActions.SLEEP]: () => {
                this.storyManager.chapter1.markSlept();
                this.setTimeOfDay(this.gameSessionManager.getWorldState().timeOfDay);
            },
            [DialogueChoiceActions.PICKUP_MAP]: () => this.pickupMap()
        }
    };

    protected giveFrozenBerries(): void {
        const inventory = this.playerStateManager.getPlayerState().inventory;
        const alreadyHasBerries = inventory.find(item => item instanceof FrozenBerries) !== null;

        if (alreadyHasBerries) {
            return;
        }

        const berries = new FrozenBerries(1);
        const addedItem = inventory.add(berries);

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

        if (addedItem !== null) {
            this.storyManager.chapter1.markMapPickedUp();
            this.onMapPickedUp();
        }
    }

    protected gotoChapter2(): void {
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
