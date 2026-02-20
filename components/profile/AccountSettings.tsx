import { User } from '@/lib/types';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, User as UserIcon, Building, Briefcase, Camera, Shield, Bell, Lock, Upload, X } from 'lucide-react';

export function AccountSettings({
    user,
    onSave
}: {
    user: User,
    onSave?: (updatedUser: Partial<User>) => void
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            if (onSave) {
                onSave({
                    avatarUrl: avatarPreview || undefined
                });
            }
            setIsSaving(false);
        }, 800);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeAvatar = () => {
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div id="account-settings" className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-border/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold">Account Settings</h2>
                        <p className="text-sm text-muted-foreground">Manage your personal information and preferences</p>
                    </div>
                </div>

                {/* Profile Picture Upload Section */}
                <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-dashed border-border/50 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 ring-4 ring-primary/10 bg-slate-800 flex items-center justify-center">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Profile Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-sm font-bold mb-1">Profile Picture</h3>
                        <p className="text-xs text-muted-foreground mb-4">Upload a new avatar. JPG, GIF or PNG. Max size of 800K</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <Button
                                size="sm"
                                onClick={triggerFileInput}
                                className="flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Upload New
                            </Button>
                            {avatarPreview && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={removeAvatar}
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    defaultValue={user.name}
                                    className="w-full bg-slate-800/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    defaultValue={user.email}
                                    className="w-full bg-slate-800/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Department</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    defaultValue={user.department || ''}
                                    placeholder="e.g. Operations"
                                    className="w-full bg-slate-800/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Job Title</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    defaultValue={user.jobTitle || ''}
                                    placeholder="e.g. Manager"
                                    className="w-full bg-slate-800/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground min-w-[120px]"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-2xl p-6 border border-border/50 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Security</h3>
                    <p className="text-[10px] text-muted-foreground">Password, 2FA, Sessions</p>
                </div>
                <div className="glass rounded-2xl p-6 border border-border/50 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Notifications</h3>
                    <p className="text-[10px] text-muted-foreground">Email, Desktop, Mobile</p>
                </div>
                <div className="glass rounded-2xl p-6 border border-border/50 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Privacy</h3>
                    <p className="text-[10px] text-muted-foreground">Data export, Visibility</p>
                </div>
            </div>
        </div>
    );
}

