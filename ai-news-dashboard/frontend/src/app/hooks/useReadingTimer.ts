import { useEffect, useRef, useState } from 'react';

const MY_EMAIL = "abhayliveyourlife@gmail.com"; 

export function useReadingTimer() {
    // We store the 'formatted' string in state so the UI only updates when the text changes
    const [timeDisplay, setTimeDisplay] = useState("0m");
    const secondsRead = useRef(0);
    const lastSyncedSeconds = useRef(0);
    const isHydrated = useRef(false);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // Helper: Converts seconds to "3h 15m" or "45m"
    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m}m`;
    };

    const syncWithBackend = async (secondsToAdd: number) => {
        if (secondsToAdd <= 0) return;
        try {
            await fetch('/api/sync-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: MY_EMAIL, seconds: secondsToAdd }),
            });
            lastSyncedSeconds.current += secondsToAdd;
        } catch (err) {
            console.error("Sync failed:", err);
        }
    };

    useEffect(() => {
        const fetchInitialTime = async () => {
            try {
                const res = await fetch(`/api/get-time?email=${encodeURIComponent(MY_EMAIL)}`);
                const data = await res.json();
                const startSeconds = data.total_seconds || 0;
                
                secondsRead.current = startSeconds;
                lastSyncedSeconds.current = startSeconds;
                setTimeDisplay(formatTime(startSeconds));
                
                isHydrated.current = true;
            } catch (err) {
                isHydrated.current = true;
            }
        };
        fetchInitialTime();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!document.hidden && isHydrated.current) {
                secondsRead.current += 1;

                // Update UI only when a new minute starts (every 60 seconds)
                if (secondsRead.current % 60 === 0) {
                    setTimeDisplay(formatTime(secondsRead.current));
                }

                // Sync with DB every 60 seconds
                const unsynced = secondsRead.current - lastSyncedSeconds.current;
                if (unsynced >= 60) {
                    syncWithBackend(unsynced);
                }
            }
        }, 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isHydrated.current) {
                const unsynced = secondsRead.current - lastSyncedSeconds.current;
                if (unsynced > 0) {
                    const blob = new Blob(
                        [JSON.stringify({ email: MY_EMAIL, seconds: unsynced })],
                        { type: 'application/json' }
                    );
                    navigator.sendBeacon(`${BACKEND_URL}/sync-time`, blob);
                    lastSyncedSeconds.current = secondsRead.current;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return { formattedTime: timeDisplay };
}