import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
    const hoverClass = hover ? 'hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:border-primary/40' : '';

    return (
        <div className={`bg-card/60 backdrop-blur-sm border border-border/50 p-6 rounded-xl transition-all duration-300 ${hoverClass} ${className}`}>
            {children}
        </div>
    );
}
