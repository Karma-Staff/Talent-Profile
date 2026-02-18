import { UserRole } from './types';

export interface Permission {
    viewCandidates: boolean;
    viewFullPII: boolean;
    addEditDeleteCandidates: boolean;
    downloadResumes: boolean;
    scheduleMeetings: boolean;
    viewAllMeetings: boolean;
    viewAuditLogs: boolean;
}

const rolePermissions: Record<UserRole, Permission> = {
    admin: {
        viewCandidates: true,
        viewFullPII: true,
        addEditDeleteCandidates: true,
        downloadResumes: true,
        scheduleMeetings: true,
        viewAllMeetings: true,
        viewAuditLogs: true,
    },
    customer_service: {
        viewCandidates: true,
        viewFullPII: true,
        addEditDeleteCandidates: true,
        downloadResumes: true,
        scheduleMeetings: true,
        viewAllMeetings: true,
        viewAuditLogs: true,
    },
    client: {
        viewCandidates: true,
        viewFullPII: false,
        addEditDeleteCandidates: false,
        downloadResumes: false,
        scheduleMeetings: true,
        viewAllMeetings: false,
        viewAuditLogs: false,
    },
};

export function getPermissions(role: UserRole | undefined): Permission | undefined {
    if (!role) return undefined;
    return rolePermissions[role];
}

export function canViewPII(role: UserRole | undefined): boolean {
    if (!role || !rolePermissions[role]) return false;
    return rolePermissions[role].viewFullPII;
}

export function canManageCandidates(role: UserRole | undefined): boolean {
    if (!role || !rolePermissions[role]) return false;
    return rolePermissions[role].addEditDeleteCandidates;
}

export function canScheduleMeetings(role: UserRole | undefined): boolean {
    if (!role || !rolePermissions[role]) return false;
    return rolePermissions[role].scheduleMeetings;
}

export function canViewAuditLogs(role: UserRole | undefined): boolean {
    if (!role || !rolePermissions[role]) return false;
    return rolePermissions[role].viewAuditLogs;
}
