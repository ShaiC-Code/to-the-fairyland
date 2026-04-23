import Rect from "../../../Wolfie2D/Nodes/Graphics/Rect";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Color from "../../../Wolfie2D/Utils/Color";

/**
 * A rectangle overlay with a circular cutout (spotlight/fog of war effect).
 * Uses Canvas 2D compositing to subtract a circle from the center.
 */
export default class SpotlightOverlay extends Rect {
    /** The radius of the visible circle */
    radius: number;
    /** The radius of the visible circle */
    innerRadius: number;
    /** The color of the overlay */
    overlayColor: Color;

    constructor(position: Vec2, size: Vec2, radius: number, innerRadiusRatio: number , overlayColor: Color) {
        super(position, size);
        this.radius = radius;
        innerRadiusRatio = Math.max(0, Math.min(innerRadiusRatio, 1)); // Clamp to [0, 1]
        this.innerRadius = radius * innerRadiusRatio;
        this.overlayColor = overlayColor;
        // Register this as a custom shader node for the engine
        this.useCustomShader("spotlight");
    }

    /**
     * Custom render method for Canvas2D. Called by the engine if hasCustomShader is true.
     * @param ctx The CanvasRenderingContext2D
     */
    renderCustom(ctx: CanvasRenderingContext2D) {
        if (this.layer.isHidden() || !this.visible) return;
        
        const w = this.size.x;
        const h = this.size.y;

        const innerRadius = this.innerRadius;
        const outerRadius = this.radius;

        // --- Create offscreen canvas ---
        const buffer = document.createElement('canvas');
        buffer.width = w;
        buffer.height = h;

        const bctx = buffer.getContext('2d')!;

        // Move origin to center (to match your main ctx)
        bctx.translate(w / 2, h / 2);

        // --- 1. Fill overlay ---
        bctx.fillStyle = this.overlayColor.toStringRGBA();
        bctx.fillRect(-w / 2, -h / 2, w, h);

        // --- 2. Cut gradient hole (SAFE here) ---
        bctx.globalCompositeOperation = 'destination-out';

        const grad = bctx.createRadialGradient(
            0, 0, 0,
            0, 0, outerRadius
        );
        
        grad.addColorStop(0.00, 'rgba(0,0,0,1.00)');
        grad.addColorStop(0.08, 'rgba(0,0,0,0.98)');
        grad.addColorStop(0.20, 'rgba(0,0,0,0.92)');
        grad.addColorStop(0.38, 'rgba(0,0,0,0.78)');
        grad.addColorStop(0.60, 'rgba(0,0,0,0.48)');
        grad.addColorStop(0.82, 'rgba(0,0,0,0.18)');
        grad.addColorStop(1.00, 'rgba(0,0,0,0.00)');
        

        bctx.fillStyle = grad;
        bctx.beginPath();
        bctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        bctx.fill();

        // --- 3. Draw result onto main canvas ---
        ctx.drawImage(buffer, -w / 2, -h / 2);
    }

    /**
     * Set the spotlight radius.
     */
    setRadius(radius: number) {
        this.radius = radius;
    }

    /**
     * Set the spotlight radius.
     */
    setInnerRadiusRatio(innerRadiusRatio: number) {
        innerRadiusRatio = Math.max(0, Math.min(innerRadiusRatio, 1)); // Clamp to [0, 1]
        this.innerRadius = this.radius * innerRadiusRatio;
    }

    /**
     * Set the overlay color.
     */
    setOverlayColor(overlayColor: Color) {
        this.overlayColor = overlayColor;
    }
}
