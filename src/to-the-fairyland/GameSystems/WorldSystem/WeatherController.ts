import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import Receiver from "../../../Wolfie2D/Events/Receiver";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import { AudioChannelType } from "../../../Wolfie2D/Sound/AudioManager";
import SnowflakeBehavior, { SnowflakeSettings } from "../../AI/SnowflakeBehavior";
import { AssetBundle } from "../../Scenes/MappedAdventureScene";
import { WeatherType } from "./WorldState";

type SnowPreset = Readonly<{
    poolSize: number;
    fadeInSpeed: number;
    scaleMin: number;
    scaleMax: number;
    settings: SnowflakeSettings;
}>;

export default class WeatherController implements Updateable {
    private assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {}
    };

    protected scene: Scene;
    protected viewport: Viewport;
    
    protected reciever: Receiver;
    protected emitter: Emitter;

    private snowflakes: Sprite[] = [];
    private weatherActive = false;
    private weatherAlpha = 0;
    private weatherFadeInSpeed = 0.5;
    private weatherLayerDepth = 50;

    private weatherAmbienceLoopsStarted = false;
    private weatherAmbienceMode: "inside" | "outside" | null = null;
    private weatherAmbienceIndoors: boolean = false;

    private readonly weatherAmbienceInsideChannel: AudioChannelType = AudioChannelType.CUSTOM_1;
    private readonly weatherAmbienceOutsideChannel: AudioChannelType = AudioChannelType.CUSTOM_2;
    private readonly weatherAmbienceFadeSeconds = 0.5;
    private readonly weatherAmbienceInitialFadeSeconds = 1.0;
    
    private readonly weatherLayerName = "weather";

    constructor(scene: Scene, viewport: Viewport) {
        this.scene = scene;
        this.viewport = viewport;
        this.reciever = new Receiver();
        this.emitter = new Emitter();
        this.scene.addLayer(this.weatherLayerName, this.weatherLayerDepth);
    }
    
    get sceneAssets() {
        return this.assetBundle;
    }

    set sceneAssets(value: AssetBundle) {
        this.assetBundle = value;
    }

    public update(deltaT: number): void {
        if (this.weatherActive && this.weatherAlpha < 1) {
            this.weatherAlpha = Math.min(this.weatherAlpha + deltaT * this.weatherFadeInSpeed, 1);
            for (const flake of this.snowflakes) {
                flake.alpha = this.weatherAlpha;
            }
        }

        this.syncWeatherAmbience();
    }

    public setWeatherAmbienceIndoors(indoors: boolean): void {
        this.weatherAmbienceIndoors = indoors;
        this.syncWeatherAmbience();
    }

    public startWeatherAmbienceLoops(): void {
        if (this.weatherAmbienceLoopsStarted) {
            return;
        }
        this.weatherAmbienceLoopsStarted = true;

        if (this.weatherAmbienceIndoors) {
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, {channel: this.weatherAmbienceInsideChannel});
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {channel: this.weatherAmbienceOutsideChannel});
        } else {
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {channel: this.weatherAmbienceInsideChannel});
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, {channel: this.weatherAmbienceOutsideChannel});
        }

        // Start weather ambience stems once and keep them running across mapped scenes.
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.sceneAssets.sounds.weatherSnowInsideSFX.key,
            loop: true,
            holdReference: true,
            channel: this.weatherAmbienceInsideChannel,
            fadeInSeconds: this.weatherAmbienceInitialFadeSeconds
        });

        this.emitter.fireEvent(GameEventType.PLAY_SFX, {
            key: this.sceneAssets.sounds.weatherSnowOutsideSFX.key,
            loop: true,
            holdReference: true,
            channel: this.weatherAmbienceOutsideChannel,
            fadeInSeconds: this.weatherAmbienceInitialFadeSeconds
        });
    }

    protected syncWeatherAmbience(): void {
        if (!this.weatherActive) {
            this.muteWeatherAmbience(this.weatherAmbienceFadeSeconds);
            return;
        }

        const fadeSeconds = this.weatherAmbienceMode === null
            ? this.weatherAmbienceInitialFadeSeconds
            : this.weatherAmbienceFadeSeconds;

        this.setWeatherAmbience(this.weatherAmbienceIndoors, fadeSeconds);
    }
    
    public setWeatherAmbience(indoor: boolean, fadeSeconds: number = 0.35): void {
        const nextMode: "inside" | "outside" = indoor ? "inside" : "outside";
        if (this.weatherAmbienceMode === nextMode) {
            return;
        }

        this.weatherAmbienceMode = nextMode;

        const insideEvent = {
            channel: this.weatherAmbienceInsideChannel,
            fadeSeconds
        };
        const outsideEvent = {
            channel: this.weatherAmbienceOutsideChannel,
            fadeSeconds
        };

        if (indoor) {
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, insideEvent);
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, outsideEvent);
        } else {
            this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, insideEvent);
            this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, outsideEvent);
        }
    }
    
    public muteWeatherAmbience(fadeSeconds: number = 0): void {
        this.weatherAmbienceMode = null;
        this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {
            channel: this.weatherAmbienceInsideChannel,
            fadeSeconds
        });
        this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, {
            channel: this.weatherAmbienceOutsideChannel,
            fadeSeconds
        });
    }

    public setWeather(weather: WeatherType, layerDepth: number = this.weatherLayerDepth): void {
        if (weather === WeatherType.NONE) {
            for (const flake of this.snowflakes) {
                flake.visible = false;
            }
            this.weatherActive = false;
            this.muteWeatherAmbience(this.weatherAmbienceFadeSeconds);
            return;
        }
    
        const preset = this.getSnowPreset(weather);
        this.weatherLayerDepth = layerDepth;
        this.weatherFadeInSpeed = preset.fadeInSpeed;
        this.ensureSnowPool(preset);
        this.weatherAlpha = 0;
    
        for (let i = 0; i < this.snowflakes.length; i++) {
            const flake = this.snowflakes[i];
    
            if (i < preset.poolSize) {
                const scale = preset.scaleMin + Math.random() * (preset.scaleMax - preset.scaleMin);
    
                flake.visible = true;
                flake.alpha = 0;
                flake.scale.set(scale, scale);

                const flakeAI = flake.ai as SnowflakeBehavior;
                flakeAI.activate({ settings: preset.settings });
                flakeAI.scatterOnScreen();
            } else {
                flake.visible = false;
            }
        }
    
        this.weatherActive = true;
        this.syncWeatherAmbience();
    }
    
    private ensureSnowPool(preset: SnowPreset): void {  
        const snowflakeKeys = [
            this.sceneAssets.sprites.snowflake1Sprite.key,
            this.sceneAssets.sprites.snowflake2Sprite.key,
            this.sceneAssets.sprites.snowflake3Sprite.key
        ];  

        while (this.snowflakes.length < preset.poolSize) {
            const key = snowflakeKeys[this.snowflakes.length % snowflakeKeys.length];
            const flake = this.scene.add.sprite(key, this.weatherLayerName);
    
            flake.visible = false;
            flake.addAI(SnowflakeBehavior, {
                viewport: this.viewport,
                settings: preset.settings
            });
    
            this.snowflakes.push(flake);
        }
    }
    
    private getSnowPreset(weather: WeatherType): SnowPreset {
        switch (weather) {
        case WeatherType.SNOW:
            return {
                poolSize: 80,
                fadeInSpeed: 0.35,
                scaleMin: 0.28,
                scaleMax: 0.5,
                settings: {
                    spawnPadding: 96,
                    recyclePadding: 128,
                    inflowEpsilon: 5,
                    baseSpeedMin: 25,
                    baseSpeedMax: 55,
                    angleMinDegrees: 5,
                    angleMaxDegrees: 12,
                    wobbleAmplitudeMin: 3,
                    wobbleAmplitudeMax: 10,
                    wobbleFrequencyMin: 0.4,
                    wobbleFrequencyMax: 1.1
                }
            };

        case WeatherType.SNOWSTORM:
            return {
                poolSize: 340,
                fadeInSpeed: 0.75,
                scaleMin: 0.48,
                scaleMax: 1.00,
                settings: {
                    spawnPadding: 128,
                    recyclePadding: 160,
                    inflowEpsilon: 5,
                    baseSpeedMin: 130,
                    baseSpeedMax: 400,
                    angleMinDegrees: 28,
                    angleMaxDegrees: 62,
                    wobbleAmplitudeMin: 14,
                    wobbleAmplitudeMax: 56,
                    wobbleFrequencyMin: 0.9,
                    wobbleFrequencyMax: 2.1
                }
            };

        default:
            throw new Error(`Weather preset not defined for weather type "${weather}"`);
        }
    }
}
