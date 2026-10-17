import { describe, expect, it } from 'vitest';
import { buttonVariants } from './button';

describe('evo button', () => {
    it('applies the orange primary class and 36px default height', () => {
        const classes = buttonVariants({ variant: 'default', size: 'default' });

        expect(classes).toContain('evo-btn');
        expect(classes).toContain('h-9');
        expect(classes).toContain('bg-[var(--evo-primary)]');
        expect(classes).toContain('text-[var(--evo-on-primary)]');
    });

    it('keeps compact controls at the comfortable 36px target', () => {
        expect(buttonVariants({ size: 'sm' })).toContain('h-9');
    });
});
