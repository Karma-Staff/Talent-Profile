import { User } from '@/lib/types';
import { Mail, Briefcase, Calendar, Users, User as UserIcon, Pencil } from 'lucide-react';

export function ProfileCard({ user }: { user: User }) {
    return (
        <div className="glass rounded-2xl p-6 border border-border/50 relative">
            <button
                onClick={() => document.getElementById('account-settings')?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute top-6 right-6 p-2 rounded-lg hover:bg-secondary transition-colors text-primary"
                title="Edit Profile"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 mb-4 shadow-xl">
                    <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {user.role}
                    </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{user.department || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{user.jobTitle || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Member since {user.memberSince || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}
