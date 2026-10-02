import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { frZodErrorMap } from './form-messages';

describe('French zod messages', () => {
    it('translates required and email errors', () => {
        const schema = z.object({
            name: z.string().min(1),
            email: z.string().email(),
        });
        const result = schema.safeParse({ name: '', email: 'pas-un-email' }, { errorMap: frZodErrorMap });

        expect(result.success).toBe(false);

        if (result.success) {
            return;
        }

        const messages = result.error.issues.map((issue) => issue.message);

        expect(messages).toContain('Ce champ est obligatoire.');
        expect(messages).toContain('Saisissez une adresse e-mail valide.');
    });
});
