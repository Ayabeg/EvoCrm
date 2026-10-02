import { t } from '@/lib/i18n';
import { ACTION_LABELS, OPERATOR_LABELS, triggerLabel } from '@/lib/workflow-authoring';

export function workflowTriggerLabel(trigger: string): string {
    return t(triggerLabel(trigger));
}

export function workflowActionLabel(action: string): string {
    return t(ACTION_LABELS[action] ?? action);
}

export function workflowOperatorLabel(operator: string): string {
    return t(OPERATOR_LABELS[operator] ?? operator);
}

export const SECTION_LABELS = {
    when: 'WHEN',
    if: 'IF',
    then: 'THEN',
    else: 'ELSE',
} as const;
