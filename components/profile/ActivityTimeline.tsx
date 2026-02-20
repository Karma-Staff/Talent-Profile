import { UserActivity } from '@/lib/types';
import { Circle } from 'lucide-react';

export function ActivityTimeline({ activities }: { activities: UserActivity[] }) {
    return (
        <div className="glass rounded-2xl p-6 border border-border/50 min-h-[500px]">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-0">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative pl-8 pb-8 group">
                        {/* Timeline line */}
                        {index !== activities.length - 1 && (
                            <div className="absolute left-[7px] top-[14px] bottom-0 w-0.5 bg-border/50 group-hover:bg-primary/20 transition-colors"></div>
                        )}

                        {/* Status dot */}
                        <div className="absolute left-0 top-[2px] w-4 h-4 flex items-center justify-center">
                            <div className={`w-3 h-3 rounded-full border-2 border-background ${activity.status === 'away' ? 'bg-cyan-400' : 'bg-slate-700'
                                }`}></div>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground mb-0.5">{activity.action}</span>
                            {activity.type === 'time_log' && (
                                <span className="text-xs text-muted-foreground mb-1">
                                    {activity.status === 'working' ? 'Working' : 'Away'}: {activity.timeRange} ({activity.duration})
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground/60">{activity.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
