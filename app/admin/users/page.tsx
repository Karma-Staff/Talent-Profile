'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Check, Shield, UserCog, Briefcase } from 'lucide-react';
import { redirect } from 'next/navigation';
import { User, UserRole } from '@/lib/types';

// Local User interface removed, using imported one

const ROLE_CONFIG: Record<UserRole, { label: string; icon: any; color: string; bg: string }> = {
    admin: { label: 'Admin', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    customer_service: { label: 'Customer Service', icon: UserCog, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    client: { label: 'Client', icon: Briefcase, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
};

export default function UserManagementPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'client' as UserRole,
        hiringNeeds: '',
        targetEmployee: '',
        softwareStack: ''
    });
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | UserRole>('all');

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Must be AFTER all hooks
    if (!session) return null;
    if (user?.role !== 'admin' && user?.role !== 'customer_service') {
        redirect('/dashboard');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const isEdit = !!editingUser;
            const res = await fetch('/api/users', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEdit ? { ...formData, id: editingUser.id } : formData),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save user');
                return;
            }

            await fetchUsers();
            resetForm();
        } catch (err) {
            setError('Failed to save user');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
                return;
            }
            await fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const startEdit = (u: User) => {
        // Prevent CS from editing non-client users
        if (user?.role === 'customer_service' && u.role !== 'client') {
            alert('You can only edit Client users.');
            return;
        }
        setEditingUser(u);
        setFormData({
            name: u.name,
            email: u.email,
            role: u.role,
            hiringNeeds: u.hiringNeeds || '',
            targetEmployee: u.targetEmployee || '',
            softwareStack: u.softwareStack || ''
        });
        setShowForm(true);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            role: 'client',
            hiringNeeds: '',
            targetEmployee: '',
            softwareStack: ''
        });
        setShowForm(false);
        setError('');
    };

    const filteredUsers = users.filter(u => {
        if (filter !== 'all' && u.role !== filter) return false;
        return true;
    });

    const roleCounts = {
        all: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        customer_service: users.filter(u => u.role === 'customer_service').length,
        client: users.filter(u => u.role === 'client').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">Manage platform users and access roles</p>
                    </div>
                    <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add User
                    </Button>
                </div>

                {/* Role Filters */}
                <div className="flex gap-2 pb-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                    >
                        All Users
                    </button>
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilter(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === role
                                ? ROLE_CONFIG[role].bg + ' ' + ROLE_CONFIG[role].color + ' border-transparent ring-1 ring-primary/20'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {ROLE_CONFIG[role].label}
                        </button>
                    ))}
                </div>

                {/* Form Card */}
                {showForm && (
                    <Card className="p-6 border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                {editingUser ? (
                                    <>
                                        <Edit className="w-5 h-5 text-primary" />
                                        Edit User
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-primary" />
                                        Create New User
                                    </>
                                )}
                            </h2>
                            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.admin][])
                                        .filter(([role]) => {
                                            // Customer Service can only see/select Client role
                                            if (user?.role === 'customer_service') return role === 'client';
                                            return true;
                                        })
                                        .map(([role, config]) => {
                                            const Icon = config.icon;
                                            const isSelected = formData.role === role;
                                            return (
                                                <div
                                                    key={role}
                                                    className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-all ${isSelected
                                                        ? 'bg-primary/5 border-primary ring-1 ring-primary/30'
                                                        : 'bg-card border-border hover:border-primary/30'
                                                        }`}
                                                    onClick={() => setFormData({ ...formData, role })}
                                                >
                                                    <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                                                            {config.label}
                                                        </div>
                                                    </div>
                                                    {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {formData.role === 'client' && (
                                <div className="space-y-4 pt-4 border-t border-border mt-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-green-400" />
                                        Client Onboarding Questionnaire (Optional)
                                    </h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">What kind of employee are they looking for?</label>
                                        <Textarea
                                            placeholder="E.g. Experienced restoration project manager..."
                                            value={formData.targetEmployee}
                                            onChange={(e) => setFormData({ ...formData, targetEmployee: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">What help do they need most with?</label>
                                        <Textarea
                                            placeholder="E.g. Handling insurance claims, managing crews..."
                                            value={formData.hiringNeeds}
                                            onChange={(e) => setFormData({ ...formData, hiringNeeds: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">What software do they use?</label>
                                        <Input
                                            placeholder="E.g. Xactimate, Dash, QuickBooks..."
                                            value={formData.softwareStack}
                                            onChange={(e) => setFormData({ ...formData, softwareStack: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 text-sm p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button type="submit">
                                    <Check className="w-4 h-4 mr-2" />
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>

                            {!editingUser && (
                                <p className="text-xs text-muted-foreground">
                                    Default password for new users is <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground">demo123</code>
                                </p>
                            )}
                        </form>
                    </Card>
                )}

                {/* Users List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredUsers.map((u) => {
                            const config = ROLE_CONFIG[u.role];
                            const Icon = config.icon;
                            const isCurrentUser = u.id === user?.id;

                            return (
                                <Card key={u.id} className="p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg} border`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{u.name}</span>
                                                {isCurrentUser && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">You</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.bg} ${config.color} border`}>
                                            {config.label}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(u)}
                                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                                title="Edit user"
                                            >
                                                <Edit className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            {!isCurrentUser && user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No users found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
