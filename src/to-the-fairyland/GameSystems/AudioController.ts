import Emitter from "../../Wolfie2D/Events/Emitter";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Receiver from "../../Wolfie2D/Events/Receiver";
import AudioManager, { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";

export default class AudioController {  
    protected reciever: Receiver;
    protected emitter: Emitter;

    constructor() {
        this.reciever = new Receiver();
        this.emitter = new Emitter();
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

    public playMusic(key: string, loop: boolean = false, holdReference: boolean = false): void {
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, { key: key, loop: loop, holdReference: holdReference });
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