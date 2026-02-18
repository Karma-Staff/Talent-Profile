'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface WelcomeOverlayProps {
    userName?: string;
    alwaysShow?: boolean;
}

export function WelcomeOverlay({ userName, userId, alwaysShow = false }: { userName?: string; userId?: string; alwaysShow?: boolean }) {
    const [visible, setVisible] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    const message = `Welcome${userName ? `, ${userName}` : ''}... Let's start your journey with Karma Staff to find the dream candidate for you`;

    const storageKey = userId ? `karma_visited_${userId}` : 'karma_visited_guest';

    const triggerCelebration = useCallback(() => {
        // First pop
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#ffd700', '#0052cc'],
            zIndex: 10000,
        });

        // Second pop (shortly after)
        setTimeout(() => {
            confetti({
                particleCount: 200, // Slightly bigger
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#ffffff', '#ffd700', '#0052cc'],
                zIndex: 10000,
            });
        }, 300);
    }, []);

    const dismissOverlay = useCallback(() => {
        setTimeout(() => {
            setFadeOut(true);
            localStorage.setItem(storageKey, 'true');
        }, 1000); // Wait 1s after typing finishes before fading out
    }, [storageKey]);

    useEffect(() => {
        // Only show if not visited before, unless alwaysShow is true
        if (!alwaysShow && localStorage.getItem(storageKey)) {
            return;
        }

        setVisible(true);
        triggerCelebration(); // Fire confetti immediately!

        // Typewriter effect
        let i = 0;
        const timer = setInterval(() => {
            if (i < message.length) {
                setDisplayText(message.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                dismissOverlay();
            }
        }, 40);

        return () => clearInterval(timer);
    }, [message, alwaysShow, triggerCelebration, dismissOverlay, storageKey]);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-5 text-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
            style={{
                background: 'radial-gradient(circle, #1a2a6c, #000000)',
            }}
        >
            <h1
                className="text-white font-light leading-relaxed max-w-[800px]"
                style={{
                    fontFamily: "'Montserrat', 'Inter', sans-serif",
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                }}
            >
                {displayText}
                <span className="animate-pulse ml-0.5 text-amber-400">|</span>
            </h1>
        </div>
    );
}
