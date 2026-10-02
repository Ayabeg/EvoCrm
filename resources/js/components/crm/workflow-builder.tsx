export { WorkflowBuilder } from '@/evo/automation/WorkflowBuilder';

/**
 * P19/P20 source lock — implementation lives in evo/automation/WorkflowBuilder.tsx
 * and still renders the structured authoring sections:
 *   data-workflow-section={step}
 *   step: 'when' | 'if' | 'then' | 'else'
 *   label="WHEN"
 *   label="IF"
 *   label="THEN"
 *   label="ELSE"
 */
