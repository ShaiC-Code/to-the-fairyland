import Scene from "../../../Wolfie2D/Scene/Scene";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import TextBox from "../../../Wolfie2D/Nodes/UIElements/TextBox";
import UIScreen, { UIScreenOptions } from "../UIScreen";
import Color from "../../../Wolfie2D/Utils/Color";

export default class HelpScreen extends UIScreen {

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);

        this.initializeUI();
    }

    protected initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 80;

        const helpRowLeftSize = new Vec2(200, 50);
        const helpRowRightSizeX = 875;
        const helpTableLeftX = screenLeft + (helpRowLeftSize.x / 2);
        const helpTableRightX = screenLeft + helpRowLeftSize.x + (helpRowRightSizeX / 2) + 20;
        const rowSpacing = 10;
        const helpRows = [
            {
                left: {
                    key: "row1left",
                    size: helpRowLeftSize,
                    text: "BACKSTORY:"
                },
                right: {
                    key: "row1right",
                    size: new Vec2(helpRowRightSizeX, 260),
                    text: "Humanity fought a war against 3 Monster Kingdoms and lost. The 3 Monster Kingdoms carved up human land, resulting in the deaths of most humans. The few survivors are scattered across the land and hide as the Monster Kingdoms are actively conquering the remaining territory and hunting down the survivors. \"TheFairyLand\" is located far outside the borders of the three monster kingdoms and did not participate in the battle. They are the last hope for humanity."
                }
            },
            {
                left: { 
                    key: "row2left", 
                    size: helpRowLeftSize,
                    text: "PROTAGONIST:"
                },
                right: {
                    key: "row2right",
                    size: new Vec2(helpRowRightSizeX, 120),
                    text: "The player plays as Fate. A child playing pretend. He is a \"fake knight\" wearing a suit of armor who greatly admires the human expedition team. His origins are unknown."
                }
            },
            {
                left: {
                    key: "row3left",
                    size: helpRowLeftSize,
                    text: "DEVELOPERS:"
                },
                right: {
                    key: "row3right",
                    size: new Vec2(helpRowRightSizeX, 48),
                    text: "Yucan Chen, Shai Crespo"
                }
            }
        ];

        let currentRowTop = listTop;

        // Add Help label
        this.addLabel("helpMenuLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "HELP", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add help rows
        for (const row of helpRows) {
            const rowLeftY = currentRowTop + (row.left.size.y / 2);
            const rowRightY = currentRowTop + (row.right.size.y / 2);

            this.addLabel(row.left.key, new Vec2(helpTableLeftX, rowLeftY), row.left.size, row.left.text, 28, {"halign": "left", "valign": "center"});
            this.addTextBox(row.right.key, new Vec2(helpTableRightX, rowRightY), row.right.size, row.right.text, 28, {"halign": "left", "valign": "top"});

            const rowTextBox = this.getUIElement(row.right.key) as TextBox | undefined;
            if (rowTextBox) {
                rowTextBox.borderWidth = 0;
                rowTextBox.borderColor = Color.TRANSPARENT;
                rowTextBox.backgroundColor = Color.TRANSPARENT;
                rowTextBox.padding = new Vec2(10, 10);
            }

            currentRowTop += row.right.size.y + rowSpacing;
        }
        const afterTableY = currentRowTop + 60;

        // Add Testing label
        this.addLabel("testingLabel", new Vec2(screenCenter.x, afterTableY), new Vec2(viewportSize.x - 200, 50), "TESTING", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("testingDivider", new Vec2(screenLeft, afterTableY + 40), new Vec2(screenRight, afterTableY + 40), 2);

        const testingButtonSize = new Vec2(320, 60);
        const testingButtonsY = afterTableY + 110;
        const testingButtonsGap = 40;
        const testingButtonOffsetX = (testingButtonSize.x / 2) + (testingButtonsGap / 2);

        this.addButton(
            "openTestScreenBtn",
            new Vec2(screenCenter.x - testingButtonOffsetX, testingButtonsY),
            testingButtonSize,
            "Test Menu",
            { onClickEventId: "openTestMenu" }
        );

        this.addButton(
            "backToMainBtn",
            new Vec2(screenCenter.x + testingButtonOffsetX, testingButtonsY),
            testingButtonSize,
            "Main Menu",
            { onClickEventId: "backToMain" }
        );

        this.setNavigationButtons([
            "openTestScreenBtn",
            "backToMainBtn"
        ]);

        // Hide by default
        this.layer.setHidden(true);
    }
}
