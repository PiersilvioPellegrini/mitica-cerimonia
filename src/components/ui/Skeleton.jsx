import React from 'react';

export function Skeleton({ className = '', variant = 'rect' }) {
    const baseClasses = "relative overflow-hidden bg-gray-200";
    const variantClasses = {
        rect: "rounded-lg",
        circle: "rounded-full",
        pill: "rounded-full",
        card: "rounded-[2.5rem]"
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant] || variantClasses.rect} ${className}`}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white p-3 rounded-[2.5rem] border border-gray-100 space-y-4 animate-fadeIn">
            <Skeleton variant="card" className="aspect-[3/4] w-full" />
            <div className="px-3 pb-4 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton variant="pill" className="h-4 w-1/4" />
                </div>
            </div>
        </div>
    );
}
