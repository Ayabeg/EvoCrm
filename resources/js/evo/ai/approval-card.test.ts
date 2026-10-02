import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { approvalSchema } from './approval-card';

describe('ApprovalCard HITL contract', () => {
    it('parses a pending approval and never auto-executes', () => {
        const parsed = approvalSchema.parse({
            id: 'a1',
            title: 'Envoyer le devis',
            status: 'pending',
        });

        expect(parsed.status).toBe('pending');

        const src = readFileSync(
            join(process.cwd(), 'resources/js/evo/ai/approval-card.tsx'),
            'utf8',
        );

        expect(src).toContain('never auto-executes');
        expect(src).toContain('onApprove?.(');
        expect(src).not.toMatch(/useEffect\([\s\S]*onApprove/);
        expect(src).not.toContain('autoApprove');
        expect(src).not.toContain('auto-approve');
    });

    it('workspace approve only records HITL status and never runs a tool', () => {
        const workspace = readFileSync(
            join(
                process.cwd(),
                'resources/js/components/desk/agents-workspace.tsx',
            ),
            'utf8',
        );

        expect(workspace).toContain('setChatMessageApproval(');
        expect(workspace).toContain("'approved'");
        expect(workspace).toContain("'denied'");
        expect(workspace).not.toMatch(
            /onApprove=\{[\s\S]*?(fetch\(|askAgent\(|\/ask-evo|\/api\/agent)/,
        );
        expect(workspace).not.toContain('autoApprove');
        expect(workspace).not.toContain('auto-approve');
    });
});
