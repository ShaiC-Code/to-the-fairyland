import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import { AudioChannelType } from "../../../Wolfie2D/Sound/AudioManager";
import Color from "../../../Wolfie2D/Utils/Color";
import WeatherParticleBehavior, { WeatherParticleSettings } from "../../AI/WeatherParticleBehavior";
import TintEffectOverlay from "../../Overlays/TintEffectOverlay";
import { AssetBundle } from "../../Scenes/MappedAdventureScene";
import AudioController from "../AudioController";
import { WeatherType } from "./WorldState";

type WeatherParticlePreset = Readonly<{
    poolSize: number;
    fadeInSpeed: number;
    scaleMin: number;
    scaleMax: number;
    settings: WeatherParticleSettings;
}>;

export default class WeatherController implements Updateable {
    private assetBundle: AssetBundle = {
        tilemaps: {},
        spritesheets: {},
        sprites: {},
        sounds: {},
        images: {}
    };

    protected scene: Scene;
    protected viewport: Viewport;

    private currentWeather: WeatherType = WeatherType.NONE;
    private weatherParticles: Sprite[] = [];
    private weatherActive = false;
    private weatherAlpha = 0;
    private weatherFadeInSpeed = 0.5;
    private weatherLayerDepth = 50;

    private weatherTintOverlay!: TintEffectOverlay;

    private readonly weatherAmbienceChannel: AudioChannelType = AudioChannelType.CUSTOM_1;
    private readonly weatherAmbienceFadeSeconds = 0.5;
    
    private readonly weatherTintLayerName = "weatherTintLayer";
    private readonly weatherLayerName = "weather";

    constructor(scene: Scene, viewport: Viewport) {
        this.scene = scene;
        this.viewport = viewport;

        this.weatherTintOverlay = new TintEffectOverlay(
            this.weatherTintLayerName,
            this.scene,
            () => this.viewport.getCenter(),
            () => this.viewport.getHalfSize(),
            new Color(0, 0, 0, 0)
        );

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
            for (const particle of this.weatherParticles) {
                particle.alpha = this.weatherAlpha;
            }
        }
    }

    private playWeatherAmbience(): void {
        if (this.currentWeather === WeatherType.NONE) {
            return;
        }

        AudioController.getInstance().playSound(
            this.getWeatherAmbianceKey(this.currentWeather),
            true,
            true,
            this.weatherAmbienceChannel,
            this.weatherAmbienceFadeSeconds
        );
    }

    private stopWeatherAmbience(): void {
        AudioController.getInstance().stopSound(this.getWeatherAmbianceKey(this.currentWeather));
    }

    
    public muteWeatherAmbience(): void {
        this.stopWeatherAmbience();
    }

    public setWeather(weather: WeatherType, layerDepth: number = this.weatherLayerDepth): void {
        if (weather === this.currentWeather) {
            return;
        }
        this.stopWeatherAmbience();

        this.currentWeather = weather;
        this.playWeatherAmbience();
        const color = this.getWeatherTintColor(weather);
        if (color) {
            this.weatherTintOverlay.setOverlayColor(color);
            this.weatherTintOverlay.show();
        } else {
            this.weatherTintOverlay.hide();
        }

        if (weather === WeatherType.NONE) {
            for (const particle of this.weatherParticles) {
                particle.visible = false;
            }
            this.weatherActive = false;
            return;
        }
    
        const preset = this.getWeatherParticlePreset(weather);
        this.weatherLayerDepth = layerDepth;
        this.scene.getLayer(this.weatherLayerName).setDepth(layerDepth);
        this.weatherFadeInSpeed = preset.fadeInSpeed;
        this.ensureParticlePool(preset);
        this.weatherAlpha = 0;
    
        for (let i = 0; i < this.weatherParticles.length; i++) {
            const particle = this.weatherParticles[i];
    
            if (i < preset.poolSize) {
                const scale = preset.scaleMin + Math.random() * (preset.scaleMax - preset.scaleMin);
    
                particle.visible = true;
                particle.alpha = 0;
                particle.scale.set(scale, scale);

                const particleAI = particle.ai as WeatherParticleBehavior;
                particleAI.activate({ settings: preset.settings });
                particleAI.scatterOnScreen();
            } else {
                particle.visible = false;
            }
        }
    
        this.weatherActive = true;
    }
    
    private ensureParticlePool(preset: WeatherParticlePreset): void {
        const particleKeys = this.currentWeather === WeatherType.SANDSTORM
            ? [
                this.sceneAssets.sprites.sandParticle1Sprite.key,
                this.sceneAssets.sprites.sandParticle2Sprite.key,
                this.sceneAssets.sprites.sandParticle3Sprite.key
            ]
            : [
                this.sceneAssets.sprites.snowFlake1Sprite.key,
                this.sceneAssets.sprites.snowFlake2Sprite.key,
                this.sceneAssets.sprites.snowFlake3Sprite.key
            ];

        while (this.weatherParticles.length < preset.poolSize) {
            const key = particleKeys[this.weatherParticles.length % particleKeys.length];
            const flake = this.scene.add.sprite(key, this.weatherLayerName);

            flake.visible = false;
            flake.addAI(WeatherParticleBehavior, {
                viewport: this.viewport,
                settings: preset.settings
            });

            this.weatherParticles.push(flake);
        }
    }

    private getWeatherTintColor(weather: WeatherType): Color | null {
        switch (weather) {
        case WeatherType.NONE: return null;
        case WeatherType.SNOW: return null;
        case WeatherType.SNOWSTORM: return new Color(255, 255, 255, 0.05);
        case WeatherType.SANDSTORM: return new Color(194, 154, 82, 0.4);
        default: return null;
        }
    }

    private getWeatherAmbianceKey(weather: WeatherType): string {
        switch (weather) {
        case WeatherType.NONE: return "";
        case WeatherType.SNOW: return this.sceneAssets.sounds.weatherSnowSFX.key;
        case WeatherType.SNOWSTORM: return this.sceneAssets.sounds.weatherSnowStormSFX.key;
        case WeatherType.SANDSTORM: return this.sceneAssets.sounds.weatherSandStormSFX.key;
        default: return "";
        }
    }
    
    private getWeatherParticlePreset(weather: WeatherType): WeatherParticlePreset {
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

        case WeatherType.SANDSTORM:
            return {
                poolSize: 850,
                fadeInSpeed: 2.0,
                scaleMin: 0.35,
                scaleMax: 1.1,
                settings: {
                    spawnPadding: 200,
                    recyclePadding: 240,
                    inflowEpsilon: 5,
                    baseSpeedMin: 420,
                    baseSpeedMax: 900,
                    angleMinDegrees: 72,
                    angleMaxDegrees: 86,
                    wobbleAmplitudeMin: 20,
                    wobbleAmplitudeMax: 70,
                    wobbleFrequencyMin: 2.0,
                    wobbleFrequencyMax: 5.0
                }
            };

        default:
            throw new Error(`Weather preset not defined for weather type "${weather}"`);
        }
    }
}