

import React from 'react';
import { VideoStat } from '../types';
import { formatRelativeTime } from '../utils/helpers';

export const MiniVideoDisplay: React.FC<{ video: VideoStat | null | undefined, type: 'Newest' | 'Oldest' }> = ({ video, type }) => {
    if (video === undefined) {
        return <div className="text-[11px] text-gray-500 animate-pulse">Loading...</div>;
    }
    if (video === null) {
        return <div className="text-[11px] text-gray-500 italic opacity-50">{type} video n/a</div>;
    }

    return (
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group min-w-[180px]">
            <div className="relative flex-shrink-0">
                <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-9 object-cover rounded shadow-sm border border-gray-700/50" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded"></div>
            </div>
            <div className="overflow-hidden flex flex-col justify-center">
                <p className="text-[11px] leading-snug font-bold text-gray-200 line-clamp-2 group-hover:text-indigo-400 transition-colors" title={video.title}>
                    {video.title}
                </p>
                <p className="text-[9px] text-gray-500 mt-0.5 font-mono">{formatRelativeTime(video.publishedAt)}</p>
            </div>
        </a>
    );
};