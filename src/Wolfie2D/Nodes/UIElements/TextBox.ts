import Vec2 from "../../DataTypes/Vec2";
import Color from "../../Utils/Color";
import Label from "./Label";

/** A non-interactive text box UIElement with word wrap and typewriter support */
export default class TextBox extends Label {
    /** Optional hard character cap before width-based overflow logic */
    maxCharacters: number;
    /** Characters revealed per second while typewriter mode is active */
    charsPerSecond: number;
    /** Whether typewriter mode is currently active */
    typingActive: boolean;

    /** Full source text before overflow/typing transforms */
    protected sourceText: string;
    /** The text currently rendered into Label.text */
    protected renderedText: string;
    /** Fractional counter used for smooth typewriter reveal */
    protected revealedCharacters: number;
    /** Wrapped lines ready for multiline rendering */
    protected wrappedLines: string[];
    /** Maximum number of lines to display (Infinity for unlimited) */
    maxLines: number;

    protected static measureContext: CanvasRenderingContext2D | null = null;

    constructor(position: Vec2, text: string = ""){
        super(position, "");

        this.maxCharacters = Number.POSITIVE_INFINITY;
        this.charsPerSecond = 40;
        this.typingActive = false;

        this.sourceText = text;
        this.renderedText = "";
        this.revealedCharacters = Number.POSITIVE_INFINITY;
        this.wrappedLines = [];
        this.maxLines = Number.POSITIVE_INFINITY;

        // Give a practical default size for box-style text content.
        this.size.set(260, this.fontSize + 12);
        this.hAlign = "left";
        this.vAlign = "top";
        this.padding = new Vec2(8, 6);

        this.borderColor = Color.BLACK;
        this.backgroundColor = Color.WHITE;

        this.syncRenderedText();
    }

    // @override @deprecated compatibility with existing Label API
    setText(text: string): void {
        this.sourceText = text;
        this.stopTypewriter(true);
        this.syncRenderedText();
    }

    getText(): string {
        return this.sourceText;
    }

    appendText(text: string): void {
        this.sourceText += text;
        this.syncRenderedText();
    }

    clearText(): void {
        this.sourceText = "";
        this.stopTypewriter(true);
        this.syncRenderedText();
    }

    startTypewriter(charsPerSecond: number = this.charsPerSecond): void {
        this.charsPerSecond = Math.max(1, charsPerSecond);
        this.typingActive = true;
        this.revealedCharacters = 0;
        this.syncRenderedText();
    }

    stopTypewriter(revealAll: boolean = true): void {
        this.typingActive = false;
        if(revealAll){
            this.revealedCharacters = Number.POSITIVE_INFINITY;
        }
    }

    update(deltaT: number): void {
        super.update(deltaT);

        // If external code assigns to this.text directly, treat it as the new source text.
        if(this.text !== this.renderedText){
            this.sourceText = this.text;
        }

        if(this.typingActive){
            this.revealedCharacters += this.charsPerSecond * deltaT;
            if(this.revealedCharacters >= this.sourceText.length){
                this.revealedCharacters = this.sourceText.length;
                this.typingActive = false;
            }
        }

        this.syncRenderedText();
    }

    protected syncRenderedText(): void {
        let visibleText = this.sourceText;

        if(this.typingActive){
            visibleText = visibleText.substring(0, Math.floor(this.revealedCharacters));
        }

        if(Number.isFinite(this.maxCharacters)){
            visibleText = visibleText.substring(0, this.maxCharacters);
        }

        this.wrappedLines = this.wrapText(visibleText);
        this.renderedText = this.wrappedLines.join("\n");
        this.text = this.renderedText;
    }

    protected wrapText(content: string): string[] {
        let availableWidth = this.size.x - this.padding.x*2;
        if(availableWidth <= 0 || content.length === 0){
            return [];
        }

        let lines: string[] = [];
        let words = content.split(" ");
        let currentLine = "";

        for(let word of words){
            let testLine = currentLine.length === 0 ? word : currentLine + " " + word;
            
            if(this.measureWidth(testLine) <= availableWidth){
                currentLine = testLine;
            } else {
                if(currentLine.length > 0){
                    lines.push(currentLine);
                }
                
                if(this.measureWidth(word) <= availableWidth){
                    currentLine = word;
                } else {
                    currentLine = this.breakLongWord(word, availableWidth);
                }
            }
        }

        if(currentLine.length > 0){
            lines.push(currentLine);
        }

        if(Number.isFinite(this.maxLines) && lines.length > this.maxLines){
            lines = lines.slice(0, this.maxLines);
        }

        return lines;
    }

    protected breakLongWord(word: string, maxWidth: number): string {
        if(maxWidth <= 0){
            return "";
        }

        let hi = word.length;
        let lo = 0;
        while(lo < hi){
            let mid = Math.ceil((lo + hi) / 2);
            let sample = word.substring(0, mid);
            if(this.measureWidth(sample) <= maxWidth){
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        return word.substring(0, lo);
    }

    protected measureWidth(content: string): number {
        let ctx = TextBox.getMeasureContext();
        ctx.font = this.getFontString();
        return ctx.measureText(content).width;
    }

    protected static getMeasureContext(): CanvasRenderingContext2D {
        if(!TextBox.measureContext){
            let canvas = document.createElement("canvas");
            TextBox.measureContext = canvas.getContext("2d") as CanvasRenderingContext2D;
        }

        return TextBox.measureContext;
    }
}