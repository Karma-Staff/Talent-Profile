import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'outline' | 'destructive-solid' | 'info-solid';
    className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const variantClasses = {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-accent/20 text-accent border border-accent/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        info: 'bg-primary/20 text-primary border border-primary/30',
        destructive: 'bg-red-500/20 text-red-500 border border-red-500/30',
        'destructive-solid': 'bg-red-600 text-white border-2 border-red-200 shadow-md',
        'info-solid': 'bg-blue-600 text-white border-2 border-blue-200 shadow-md',
        outline: 'border border-input bg-background text-foreground',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}
