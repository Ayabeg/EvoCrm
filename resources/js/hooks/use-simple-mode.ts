import { usePage } from '@inertiajs/react';

export type LaunchNavItem = {
    id: string;
    label: string;
    href: string;
};

export type LaunchFeatures = {
    tickets: boolean;
    sms: boolean;
    ask_evo: boolean;
    ads: boolean;
    warmup: boolean;
    report_builder: boolean;
};

const DEFAULT_FEATURES: LaunchFeatures = {
    tickets: true,
    sms: true,
    ask_evo: true,
    ads: true,
    warmup: true,
    report_builder: true,
};

export function useSimpleMode() {
    const page = usePage();
    const workspace = page.props.workspace as { simple_mode?: boolean } | null;
    const simpleMode = Boolean(page.props.simpleMode ?? workspace?.simple_mode);
    const nav = (page.props.nav ?? []) as LaunchNavItem[];
    const features = {
        ...DEFAULT_FEATURES,
        ...((page.props.features ?? {}) as Partial<LaunchFeatures>),
    };

    return { simpleMode, nav, features };
}
