'use client';

import React from 'react';

export default function DbErrorOverlay({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex h-full w-full flex-col items-center justify-center space-y-4 p-8 text-center md:max-w-md">
                <div className="rounded-full bg-destructive/10 p-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-destructive"
                    >
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" x2="12" y1="2" y2="12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    System Unavailable
                </h1>
                <p className="text-muted-foreground">
                    We are currently experiencing connectivity issues. Please check back in a few minutes.
                </p>
                <button
                    onClick={onRetry}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );
}
