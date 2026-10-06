export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const RAIL_EXPAND_MIN = 1280;

export function readSidebarCookie(): boolean | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]*)/);

    if (!match) {
        return null;
    }

    return match[1] === 'true';
}

export function writeSidebarCookie(expanded: boolean): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${SIDEBAR_COOKIE_NAME}=${expanded}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function defaultRailExpanded(
    cookie: boolean | null,
    sidebarOpen: boolean,
    viewportWidth: number,
): boolean {
    if (cookie !== null) {
        return cookie;
    }

    if (typeof window === 'undefined') {
        return sidebarOpen;
    }

    return viewportWidth >= RAIL_EXPAND_MIN;
}
