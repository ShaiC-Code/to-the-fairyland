import Game from "./Wolfie2D/Loop/Game";
import SplashScreenScene from "./to-the-fairyland/Scenes/SplashScreenScene";
import { PlayerInput } from "./to-the-fairyland/AI/Player/PlayerController";

// The main function is your entrypoint into Wolfie2D. Specify your first scene and any options here.
(function main(){
    // Run any tests
    runTests();

    // Set up options for our game
    let options = {
        canvasSize: {x: 1280, y: 900},          // The size of the game
        clearColor: {r: 0.1, g: 0.1, b: 0.1},   // The color the game clears to
        inputs: [
            {name: PlayerInput.MOVE_UP, keys: ["w", "arrowup"]},
            {name: PlayerInput.MOVE_DOWN, keys: ["s", "arrowdown"]},
            {name: PlayerInput.MOVE_LEFT, keys: ["a", "arrowleft"]},
            {name: PlayerInput.MOVE_RIGHT, keys: ["d", "arrowright"]},
            {name: PlayerInput.INTERACT, keys: ["j", "e", "z", "enter"]},
        ],
        useWebGL: false,                        // Tell the game we want to use webgl
        showDebug: false                      // Whether to show debug messages. You can change this to true if you want
    }

    // Set up custom registries

    // Create a game with the options specified
    const game = new Game(options);

    // Start our game
    game.start(SplashScreenScene, {});

})();

function runTests(){};