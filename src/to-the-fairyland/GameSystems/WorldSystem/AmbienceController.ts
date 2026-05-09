import AudioController from "../AudioController";
import { AudioChannelType } from "../../../Wolfie2D/Sound/AudioManager";

export default class AmbienceController {
    private static instance: AmbienceController;
    private readonly activeAmbiences = new Map<AudioChannelType, string>();

    private constructor() {}

    public static getInstance(): AmbienceController {
        if (!AmbienceController.instance) {
            AmbienceController.instance = new AmbienceController();
        }
        return AmbienceController.instance;
    }

    public playAmbience(channel: AudioChannelType, key: string, loop: boolean = true, holdReference: boolean = true, fadeSeconds: number = 0): void {
        if (!this.isCustomChannel(channel)) return;

        const currentKey = this.activeAmbiences.get(channel);
        if (currentKey === key) return;

        if (currentKey) {
            AudioController.getInstance().stopSound(currentKey);
        }

        AudioController.getInstance().playSound(key, loop, holdReference, channel, fadeSeconds);
        this.activeAmbiences.set(channel, key);
        AudioController.getInstance().unmuteChannel(channel, fadeSeconds);
    }

    public stopAmbience(channel: AudioChannelType, fadeSeconds: number = 0): void {
        if (!this.isCustomChannel(channel)) return;

        const currentKey = this.activeAmbiences.get(channel);
        if (!currentKey) return;

        AudioController.getInstance().muteChannel(channel, fadeSeconds);
        
        if (fadeSeconds > 0) {
            window.setTimeout(() => {
                const latestKey = this.activeAmbiences.get(channel);
                if (latestKey) {
                    AudioController.getInstance().stopSound(latestKey);
                    this.activeAmbiences.delete(channel);
                }
            }, fadeSeconds * 1000);
        } else {
            AudioController.getInstance().stopSound(currentKey);
            this.activeAmbiences.delete(channel);
        }
    }

    public stopAllAmbience(fadeSeconds: number = 0): void {
        for (const channel of Array.from(this.activeAmbiences.keys())) {
            this.stopAmbience(channel, fadeSeconds);
        }
    }

    public setVolume(channel: AudioChannelType, volume: number): void {
        if (!this.isCustomChannel(channel)) return;
        AudioController.getInstance().setChannelVolume(channel, volume);
    }

    private isCustomChannel(channel: AudioChannelType): boolean {
        return channel >= AudioChannelType.CUSTOM_1;
    }
}
