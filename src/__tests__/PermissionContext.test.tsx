import { describe, it, expect } from 'vitest';
import type { Role } from '../contexts/PermissionContext';

// hasPermission logic extracted for unit testing without React/Supabase
const roleHierarchy: Record<Role, number> = {
  User: 1,
  Admin: 2,
  'Global Admin': 3,
  Developer: 4,
};

function hasPermission(currentRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
}

describe('hasPermission role hierarchy', () => {
  it('User cannot access Admin-gated features', () => {
    expect(hasPermission('User', 'Admin')).toBe(false);
  });

  it('User cannot access Global Admin-gated features', () => {
    expect(hasPermission('User', 'Global Admin')).toBe(false);
  });

  it('User cannot access Developer-gated features', () => {
    expect(hasPermission('User', 'Developer')).toBe(false);
  });

  it('User can access User-level features', () => {
    expect(hasPermission('User', 'User')).toBe(true);
  });

  it('Admin can access User-level features', () => {
    expect(hasPermission('Admin', 'User')).toBe(true);
  });

  it('Admin can access Admin-level features', () => {
    expect(hasPermission('Admin', 'Admin')).toBe(true);
  });

  it('Admin cannot access Global Admin-gated features', () => {
    expect(hasPermission('Admin', 'Global Admin')).toBe(false);
  });

  it('Developer can access all levels', () => {
    expect(hasPermission('Developer', 'User')).toBe(true);
    expect(hasPermission('Developer', 'Admin')).toBe(true);
    expect(hasPermission('Developer', 'Global Admin')).toBe(true);
    expect(hasPermission('Developer', 'Developer')).toBe(true);
  });

  it('Global Admin cannot access Developer-gated features', () => {
    expect(hasPermission('Global Admin', 'Developer')).toBe(false);
  });
});
