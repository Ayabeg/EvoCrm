export const CARD_DRAG_THRESHOLD_PX = 6;

export type PointerPoint = { x: number; y: number };

export function pointerMovedPastThreshold(
    from: PointerPoint,
    to: PointerPoint,
    threshold: number = CARD_DRAG_THRESHOLD_PX,
): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    return dx * dx + dy * dy >= threshold * threshold;
}
