import React from 'react';

export default function LoadingSkeleton({ lines = 3, height = 14 }) {
    return (
        <div className="skeleton-block">
            {Array.from({ length: lines }, (_, index) => (
                <div
                    key={index}
                    className="skeleton-line"
                    style={{
                        height,
                        width: `${index === lines - 1 ? 70 : 100}%`
                    }}
                />
            ))}
        </div>
    );
}
