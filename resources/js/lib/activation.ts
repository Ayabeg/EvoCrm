export type ActivationStepKind = 'core' | 'optional';

export type ActivationStep = {
    id: string;
    label: string;
    description: string;
    kind: ActivationStepKind;
    complete: boolean;
    can_view: boolean;
    can_perform: boolean;
    href: string | null;
    cta_label: string | null;
    secondary_href: string | null;
    secondary_cta_label: string | null;
};

export type ActivationProgress = {
    completed: number;
    total: number;
    core_completed: number;
    core_total: number;
};

export type ActivationState = {
    activated: boolean;
    dismissed: boolean;
    visible: boolean;
    collapsed: boolean;
    progress: ActivationProgress;
    steps: ActivationStep[];
    dismiss_href: string;
};

export function activationProgressLabel(progress: ActivationProgress): string {
    return `${progress.completed} of ${progress.total}`;
}

export function activationProgressValue(progress: ActivationProgress): number {
    if (progress.total <= 0) {
        return 0;
    }

    return Math.round((progress.completed / progress.total) * 100);
}
