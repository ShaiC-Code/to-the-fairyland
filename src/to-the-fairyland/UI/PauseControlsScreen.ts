import Scene from "../../Wolfie2D/Scene/Scene";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import UIScreen, { UIScreenOptions } from "./UIScreen";
import Color from "../../Wolfie2D/Utils/Color";

export default class PauseControlsScreen extends UIScreen {
    private onClose: () => void;

    constructor(layerName: string, scene: Scene, getViewportCenter: () => Vec2, getViewportHalfSize: () => Vec2, onClose: () => void, options?: UIScreenOptions) {
        super(layerName, scene, getViewportCenter, getViewportHalfSize, options);
        this.onClose = onClose;

        this.initializeUI();
    }

    protected override initializeUI(): void {
        const viewportHalfSize = this.getViewportHalfSize();
        const viewportSize = viewportHalfSize.clone().scale(2);
        const screenCenter = viewportHalfSize.clone();

        const screenTop = screenCenter.y - viewportHalfSize.y + 100;
        const screenLeft = screenCenter.x - viewportHalfSize.x + 100;
        const screenRight = screenCenter.x + viewportHalfSize.x - 100;
        const listTop = screenTop + 120;
        const verticalOffset = 60;

        const controlRowLeftSize = new Vec2(250, 50);
        const controlRowRightSize = new Vec2(500, 50);
        const controlsTableLeftX = screenLeft + (controlRowLeftSize.x / 2);
        const controlsTableRightX = screenLeft + controlRowLeftSize.x + (controlRowRightSize.x / 2);
        const controlRows = [
            {
              left: { key: "row1left", pos: new Vec2(controlsTableLeftX, listTop), text: "↑" },
              right: { key: "row1right", pos: new Vec2(controlsTableRightX, listTop), text: "W, UP-ARROW" }
            },

            {
              left: { key: "row2left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset), text: "←" },
              right: { key: "row2right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset), text: "A, LEFT-ARROW" }
            },

            {
              left: { key: "row3left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 2), text: "↓" },
              right: { key: "row3right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 2), text: "S, DOWN-ARROW" }
            },

            {
              left: { key: "row4left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 3), text: "→" },
              right: { key: "row4right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 3), text: "D, RIGHT-ARROW" }
            },

            {
              left: { key: "row5left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 4), text: "Interact/Confirm" },
              right: { key: "row5right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 4), text: "Z, J, E, ENTER" }
            },

            {
              left: { key: "row6left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 5), text: "Attack" },
              right: { key: "row6right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 5), text: "X, K" }
            },

            {
              left: { key: "row7left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 6), text: "Inventory" },
              right: { key: "row7right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 6), text: "C" }
            },

            {
              left: { key: "row8left", pos: new Vec2(controlsTableLeftX, listTop + verticalOffset * 7), text: "Pause/Close" },
              right: { key: "row8right", pos: new Vec2(controlsTableRightX, listTop + verticalOffset * 7), text: "ESC" }
            }
        ];

        // Add semi-transparent background
        this.addRect("bg", screenCenter.clone(), viewportHalfSize.clone().scale(2), new Color(0, 0, 0, 0.7));
        
        // Add Controls label
        this.addLabel("controlsMenuLabel", new Vec2(screenCenter.x, screenTop), new Vec2(viewportSize.x - 200, 50), "CONTROLS", 48, {"halign": "left", "valign": "center"});

        // Add divider line
        this.addLine("divider", new Vec2(screenLeft, screenTop + 40), new Vec2(screenRight, screenTop + 40), 2);

        // Add control rows
        for (const row of controlRows) {
          this.addLabel(row.left.key, row.left.pos, controlRowLeftSize, row.left.text, 32, {"halign": "left", "valign": "center"});
          this.addLabel(row.right.key, row.right.pos, controlRowRightSize, row.right.text, 32, {"halign": "left", "valign": "center"});
        }

        // Add Back button
        this.addButton("backBtn", new Vec2(screenCenter.x, listTop + verticalOffset * controlRows.length), new Vec2(200, 50), "Back", {onClick: () => this.onClose()});

        this.setNavigationButtons(["backBtn"]);

        // Hide by default
        this.layer.setHidden(true);
    }
}