/**
 * Stale-request guard for A → B → C hydration.
 * Only the response whose requestId matches the active request may render.
 */
export function isStaleHydration(activeRequestId: number, incomingRequestId: number): boolean {
    return incomingRequestId !== activeRequestId;
}

export function nextRequestId(current: number): number {
    return current + 1;
}
