import Emitter from "../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Receiver from "../../Wolfie2D/Events/Receiver";
import AudioManager, { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";

export default class AudioController {  
    private static instance: AudioController;
    protected reciever: Receiver;
    protected emitter: Emitter;

    private previousMusicKey: string | null = null;
    private currentMusicKey: string | null = null;

    private constructor() {
        this.reciever = new Receiver();
        this.emitter = new Emitter();
    }

    public static getInstance(): AudioController {
        if (!AudioController.instance) {
            AudioController.instance = new AudioController();
        }
        return AudioController.instance;
    }

    public playSound(key: string, loop: boolean = false, holdReference: boolean = false, channel?: AudioChannelType, fadeSeconds?: number): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: key, loop: loop, holdReference: holdReference, channel: channel, fadeInSeconds: fadeSeconds });
    }

    public stopSound(key: string): void {
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: key });
    }

    public playSFX(key: string, loop: boolean = false, holdReference: boolean = false, channel?: AudioChannelType, fadeSeconds?: number): void {
        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: key, loop: loop, holdReference: holdReference, channel: channel, fadeInSeconds: fadeSeconds });
    }

    public async playMusic(key: string, loop: boolean = false, holdReference: boolean = false, fadeSeconds: number = 0): Promise<void> {
        if (this.currentMusicKey) {
            await this.stopMusic();
        }
        this.currentMusicKey = key;
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, { key: key, loop: loop, holdReference: holdReference });
        this.unmuteChannel(AudioChannelType.MUSIC, fadeSeconds);
    }

    public async stopMusic(fadeSeconds: number = 0): Promise<void> {
        if (!this.currentMusicKey) {
            if (this.previousMusicKey) {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.previousMusicKey });
                this.previousMusicKey = null;
            }
            return;
        }

        this.previousMusicKey = this.currentMusicKey;
        this.currentMusicKey = null;
        this.muteChannel(AudioChannelType.MUSIC, fadeSeconds);
        return new Promise<void>(resolve => window.setTimeout(() => {
            this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.previousMusicKey });
            resolve();
        }, fadeSeconds * 1000)); 
    }

    public muteChannel(channel: AudioChannelType, fadeSeconds: number = 0): void {
        this.emitter.fireEvent(GameEventType.MUTE_CHANNEL, { channel: channel, fadeSeconds: fadeSeconds });
    }

    public unmuteChannel(channel: AudioChannelType, fadeSeconds: number = 0): void {
        this.emitter.fireEvent(GameEventType.UNMUTE_CHANNEL, { channel: channel, fadeSeconds: fadeSeconds });
    }

    public setChannelVolume(channel: AudioChannelType, volume: number): void {
        AudioManager.setVolume(channel, volume);
    }
}