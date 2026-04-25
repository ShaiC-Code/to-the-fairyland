import { TimeOfDay } from "../WorldSystem/WorldState";
import {
    ActiveChapter,
    Chapter1MainQuestStep,
    Chapter2MainQuestStep,
    StoryState
} from "./StoryState";

export function getTimeOfDayForStory(story: Readonly<StoryState>): TimeOfDay {
    switch (story.activeChapter) {
        case ActiveChapter.CHAPTER1:
            switch (story.chapter1.mainQuestStep) {
                case Chapter1MainQuestStep.NEED_FOOD:
                case Chapter1MainQuestStep.NEED_TO_COOK:
                case Chapter1MainQuestStep.NEED_TO_EAT:
                case Chapter1MainQuestStep.RETURN_TO_BED:
                    return TimeOfDay.NIGHT;

                case Chapter1MainQuestStep.SLEPT:
                case Chapter1MainQuestStep.MAP_PICKED:
                    return TimeOfDay.DAY;

                default:
                    return TimeOfDay.DAY;
            }

        case ActiveChapter.CHAPTER2:
            if (!story.chapter2) {
                throw new Error("Chapter 2 story state is not initialized.");
            }

            switch (story.chapter2.mainQuestStep) {
                default:
                    return TimeOfDay.DAY;
            }

        default:
            return TimeOfDay.DAY;
    }
}
