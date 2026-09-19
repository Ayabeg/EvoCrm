import { can, canHint, parsePermissions } from '@/lib/permissions/parse';
import { fixtures } from '@/testing/fixtures';

describe('permission parsing', () => {
  it('parses /me permissions without inventing a second engine', () => {
    const permissions = parsePermissions(fixtures.meSuccess.data.permissions);
    expect(permissions).toEqual(['crm.view', 'crm.edit', 'desk.manage']);
    expect(canHint(permissions, 'crm.edit')).toBe(true);
    expect(canHint(['crm.view'], 'desk.manage')).toBe(false);
  });

  it('denies unknown and missing permissions', () => {
    const permissions = parsePermissions(fixtures.meSuccess.data.permissions);
    expect(can(permissions, 'crm.edit')).toBe(true);
    expect(can(permissions, 'settings.people')).toBe(false);
    expect(can(permissions, 'invented.permission')).toBe(false);
    expect(can(permissions, '')).toBe(false);
    expect(can([], 'crm.view')).toBe(false);
  });

  it('drops non-string values', () => {
    expect(parsePermissions(['crm.view', 1, null, ''])).toEqual(['crm.view']);
    expect(parsePermissions({ crm: true })).toEqual([]);
  });
});
