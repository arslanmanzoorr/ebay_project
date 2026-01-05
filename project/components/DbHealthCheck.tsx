'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DbErrorOverlay from './DbErrorOverlay';

// Poll interval in milliseconds (30 seconds)
const POLL_INTERVAL = 30000;

export default function DbHealthCheck() {
    const [isError, setIsError] = useState(false);

    const checkHealth = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const res = await fetch('/api/health', {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);

            if (res.status === 503 || res.status === 500) {
                setIsError(true);
            } else if (res.ok) {
                setIsError(false);
            }
        } catch (error) {
            // Network error or timeout could also indicate system issues
            console.error('Health check failed:', error);
            // We might want to be conservative and not show full blocking error on robust network glitch,
            // but if the server is unreachable, showing an error is often correct.
            // For now, let's treat network failure as a potential downtime.
            setIsError(true);
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkHealth();

        const intervalId = setInterval(checkHealth, POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [checkHealth]);

    const handleRetry = () => {
        setIsError(false); // Optimistically hide
        checkHealth(); // Immediate retry
    };

    if (!isError) return null;

    return <DbErrorOverlay onRetry={handleRetry} />;
}
