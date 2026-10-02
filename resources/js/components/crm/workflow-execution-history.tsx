export { ExecutionHistory as WorkflowExecutionHistory } from '@/evo/automation/ExecutionHistory';

/**
 * P20 source lock — history is inspect-only.
 * Retry is not available. Re-running would risk duplicate side effects.
 */
