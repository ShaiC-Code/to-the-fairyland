import type { PlayerAttackHitbox } from "./PlayerAttackController";

export interface SwordHitTarget {
    handleSwordHit(hitbox: PlayerAttackHitbox): void;
}


export default class SwordHitDispatcher {
    private readonly targets = new Set<SwordHitTarget>();

    public register(target: SwordHitTarget): void {
        this.targets.add(target);
    }

    public unregister(target: SwordHitTarget): void {
        this.targets.delete(target);
    }

    public emit(hitbox: PlayerAttackHitbox): void {
        for (const target of this.targets) {
            target.handleSwordHit(hitbox);
        }
    }

    public clear(): void {
        this.targets.clear();
    }
}