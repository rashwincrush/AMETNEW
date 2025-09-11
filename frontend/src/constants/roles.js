// ALIGN: db-enum-roles
export const ROLES = ['alumni', 'employer', 'admin', 'super_admin', 'student'];
export const isRole = (v) => typeof v === 'string' && ROLES.includes(v);
