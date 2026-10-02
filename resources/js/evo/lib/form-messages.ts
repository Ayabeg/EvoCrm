import { z } from 'zod';

/** French Zod messages for the Evo form kit. */
export const frZodErrorMap: z.ZodErrorMap = (issue, ctx) => {
    switch (issue.code) {
        case z.ZodIssueCode.invalid_type:
            if (issue.received === 'undefined' || issue.received === 'null') {
                return { message: 'Ce champ est obligatoire.' };
            }

            return { message: 'Valeur invalide.' };
        case z.ZodIssueCode.too_small:
            if (issue.type === 'string') {
                return {
                    message:
                        issue.minimum === 1
                            ? 'Ce champ est obligatoire.'
                            : `Saisissez au moins ${issue.minimum} caractères.`,
                };
            }

            if (issue.type === 'number' || issue.type === 'bigint') {
                return { message: `La valeur doit être au moins ${issue.minimum}.` };
            }

            if (issue.type === 'array') {
                return { message: `Sélectionnez au moins ${issue.minimum} élément(s).` };
            }

            return { message: 'Valeur trop petite.' };
        case z.ZodIssueCode.too_big:
            if (issue.type === 'string') {
                return { message: `Saisissez au plus ${issue.maximum} caractères.` };
            }

            if (issue.type === 'number' || issue.type === 'bigint') {
                return { message: `La valeur doit être au plus ${issue.maximum}.` };
            }

            return { message: 'Valeur trop grande.' };
        case z.ZodIssueCode.invalid_string:
            if (issue.validation === 'email') {
                return { message: 'Saisissez une adresse e-mail valide.' };
            }

            if (issue.validation === 'url') {
                return { message: 'Saisissez une URL valide.' };
            }

            return { message: 'Format invalide.' };
        case z.ZodIssueCode.custom:
            return { message: issue.message ?? 'Valeur invalide.' };
        default:
            return { message: ctx.defaultError };
    }
};

export function installFrenchZod(): void {
    z.setErrorMap(frZodErrorMap);
}
