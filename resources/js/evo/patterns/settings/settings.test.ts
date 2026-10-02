import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { WEEK_STARTS_ON } from '@/evo/lib/format';
import { settingsCopy } from './copy';
import { focusFirstInvalid } from './settings-form';

const dir = dirname(fileURLToPath(import.meta.url));
const rowSource = readFileSync(join(dir, 'settings-row.tsx'), 'utf8');
const formSource = readFileSync(join(dir, 'settings-form.tsx'), 'utf8');
const saveSource = readFileSync(join(dir, 'save-bar.tsx'), 'utf8');
const french = JSON.parse(
    readFileSync(join(dir, '../../../../../lang/fr.json'), 'utf8'),
) as Record<string, string>;

describe('settings family', () => {
    it('uses French save chrome and Saturday week start', () => {
        expect(settingsCopy.save).toBe('Enregistrer');
        expect(settingsCopy.cancel).toBe('Annuler');
        expect(settingsCopy.danger).toBe('Zone dangereuse');
        expect(settingsCopy.weekdays[0]).toEqual({ value: 6, label: 'Sam' });
        expect(WEEK_STARTS_ON).toBe(6);
        expect(saveSource).toContain('aria-live="polite"');
        expect(saveSource).toContain('settingsCopy.save');
        expect(saveSource).toContain(
            'visible ?? (isDirty === undefined ? true : isDirty)',
        );
    });

    it('wires errors through aria-describedby on the control', () => {
        expect(rowSource).toContain('aria-describedby');
        expect(rowSource).toContain('aria-invalid');
        expect(rowSource).toContain('role="alert"');
        expect(formSource).toContain('disableWhileProcessing');
        expect(formSource).toContain('noValidate');
        expect(formSource).toContain('focusFirstInvalid');
    });

    it('focuses the first invalid field', () => {
        const email = { focus: vi.fn() };
        const name = { focus: vi.fn() };
        const root = {
            querySelector(selector: string) {
                if (selector.includes('[name="email"]')) {
                    return email;
                }

                if (selector.includes('[name="name"]')) {
                    return name;
                }

                return null;
            },
        } as unknown as ParentNode;

        expect(focusFirstInvalid(root, { email: 'Saisissez une adresse e-mail valide.' })).toBe(true);
        expect(email.focus).toHaveBeenCalledTimes(1);
        expect(name.focus).not.toHaveBeenCalled();
    });

    it('keeps profile, workspace, people, and connectors chrome in the French catalogue', () => {
        expect(french['Name and email for this EvoCrm login.']).toMatch(/Nom et e-mail/);
        expect(french['On - Home, Contacts, Deals, Inbox, Quotes']).toMatch(/Activé/);
        expect(french.Invite).toBe('Inviter');
        expect(
            french[
                'Configured instances for this workspace. Apps are the products. Connectors are the accounts and sync jobs. Desk channels stay official Meta Cloud only.'
            ],
        ).toMatch(/connecteurs/);
    });
});
