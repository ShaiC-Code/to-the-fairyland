import MappedSMScene from "./MappedSMScene";

export default class SMSceneMapMain extends MappedSMScene {

    public static readonly TILEMAP_PATH = "game_assets/tilemaps/SMTilemap.json";

    public static readonly BLUE_TEAM_DATA_PATH = "game_assets/data/enemies/SMTilemap_SPY_blue.json";

    public static readonly RED_TEAM_DATA_PATH = "game_assets/data/enemies/SMTilemap_SPY_red.json";

    public static readonly HEALTHPACK_DATA_PATH = "game_assets/data/items/SMTilemap_SPY_healthpacks.json";

    public static readonly LASERGUN_DATA_PATH = "game_assets/data/items/SMTilemap_SPY_laserguns.json";

    /**
     * @see Scene.update()
     */
    public override loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet(MappedSMScene.PLAYER_SPRITESHEET_KEY, SMSceneMapMain.PLAYER_SPRITESHEET_PATH);

        // Load in the enemy sprites
        this.load.spritesheet(MappedSMScene.BLUE_ENEMY_SPRITESHEET_KEY, SMSceneMapMain.BLUE_ENEMY_SPRITESHEET_PATH);
        this.load.spritesheet(MappedSMScene.BLUE_HEALER_SPRITESHEET_KEY, SMSceneMapMain.BLUE_HEALER_SPRITESHEET_PATH);
        this.load.spritesheet(MappedSMScene.RED_ENEMY_SPRITESHEET_KEY, SMSceneMapMain.RED_ENEMY_SPRITESHEET_PATH);
        this.load.spritesheet(MappedSMScene.RED_HEALER_SPRITESHEET_KEY, SMSceneMapMain.RED_HEALER_SPRITESHEET_PATH);

        // Load the tilemap
        this.load.tilemap(MappedSMScene.TILEMAP_KEY, SMSceneMapMain.TILEMAP_PATH);

        // Load the enemy locations
        this.load.object(MappedSMScene.BLUE_TEAM_DATA_KEY, SMSceneMapMain.BLUE_TEAM_DATA_PATH);
        this.load.object(MappedSMScene.RED_TEAM_DATA_KEY, SMSceneMapMain.RED_TEAM_DATA_PATH);

        // Load the healthpack, inventory slot, and laser gun sprites
        this.load.image(MappedSMScene.HEALTHPACK_KEY, SMSceneMapMain.HEALTHPACK_PATH);
        this.load.image(MappedSMScene.LASERGUN_KEY, SMSceneMapMain.LASERGUN_PATH);
        this.load.image(MappedSMScene.INVENTORY_SLOT_KEY, SMSceneMapMain.INVENTORY_SLOT_PATH);

        // Load the healthpack and lasergun locations
        this.load.object(MappedSMScene.HEALTHPACK_DATA_KEY, SMSceneMapMain.HEALTHPACK_DATA_PATH);
        this.load.object(MappedSMScene.LASERGUN_DATA_KEY, SMSceneMapMain.LASERGUN_DATA_PATH);
    }
}