
import React from 'react';
import type { ChannelStats } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import { MiniVideoDisplay } from './MiniVideoDisplay';

interface ChannelTableProps {
    channels: ChannelStats[];
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSortChange: (key: any) => void;
    onSelect: (channelId: string) => void;
    onRemove: (channelId: string) => void;
    visibleColumns: string[];
    selectedIds: string[];
    onToggleRow: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
}

const ModernStat: React.FC<{ value: number, max: number, label: string, gradientClass: string, rawValue: string }> = ({ value, max, label, gradientClass, rawValue }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex flex-col gap-1 w-full min-w-[90px]">
            <div className="px-0.5" title={parseInt(rawValue, 10).toLocaleString()}>
                <span className="text-[10px] font-bold text-gray-300 tabular-nums">{label}</span>
            </div>
            <div className="w-full bg-gray-800/60 rounded-full h-1.5 relative overflow-hidden border border-white/5">
                <div
                    className={`${gradientClass} h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                ></div>
            </div>
        </div>
    );
}

const SortableHeader: React.FC<{
    label: string;
    sortKey: string;
    currentSort: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: any) => void;
    className?: string;
    align?: 'left' | 'right' | 'center';
    icon?: React.ReactNode;
}> = ({ label, sortKey, currentSort, onSort, className = "", align = 'left', icon }) => {
    const isActive = currentSort.key === sortKey;
    
    return (
        <th 
            className={`px-4 py-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white hover:bg-white/5 transition-all normal-case font-sans ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                <div className="flex items-center gap-1.5 opacity-90">
                    {icon}
                    <span>{label}</span>
                </div>
                <div className="flex flex-col -space-y-1 w-2">
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'asc' ? 'text-indigo-400 scale-125' : 'text-gray-600'}`}>▲</span>
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'desc' ? 'text-indigo-400 scale-125' : 'text-gray-600'}`}>▼</span>
                </div>
            </div>
        </th>
    );
};

const CircularCheckbox: React.FC<{ checked: boolean, onChange: () => void, onClick?: (e: React.MouseEvent) => void }> = ({ checked, onChange, onClick }) => (
    <div className="relative flex items-center justify-center" onClick={onClick}>
        <input 
            type="checkbox" 
            checked={checked}
            onChange={onChange}
            className="peer appearance-none h-5 w-5 border-2 border-gray-600 rounded-full bg-gray-800/50 checked:bg-indigo-500 checked:border-indigo-500 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer"
        />
        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
);

export const ChannelTable: React.FC<ChannelTableProps> = ({ 
    channels, 
    sortConfig, 
    onSortChange, 
    onSelect, 
    visibleColumns,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected
}) => {
    const maxValues = React.useMemo(() => {
        if (channels.length === 0) return { subs: 0, views: 0, videos: 0 };
        return {
            subs: Math.max(...channels.map(c => parseInt(c.subscriberCount, 10) || 0), 1),
            views: Math.max(...channels.map(c => parseInt(c.viewCount, 10) || 0), 1),
            videos: Math.max(...channels.map(c => parseInt(c.videoCount, 10) || 0), 1),
        };
    }, [channels]);

    if (channels.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                <p className="text-gray-400">No channels match the current filter.</p>
            </div>
        );
    }

    const isVisible = (colId: string) => visibleColumns.includes(colId);

    return (
        <div className="overflow-hidden rounded-xl shadow-xl border border-gray-700/50 font-sans">
            <table className="min-w-full divide-y divide-gray-800/50 table-fixed border-collapse">
                <thead className="bg-gray-950/30">
                    <tr>
                        <th className="px-4 py-3 w-12 text-center sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                            <CircularCheckbox checked={isAllSelected} onChange={onToggleAll} />
                        </th>
                        {isVisible('title') && (
                            <SortableHeader 
                                label="Channel Name" 
                                sortKey="title" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/5"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        )}
                        {isVisible('publishedAt') && (
                            <SortableHeader 
                                label="Created Date" 
                                sortKey="publishedAt" 
                                currentSort={sortConfig} 
                                onSort={onSortChange}
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>}
                            />
                        )}
                        {isVisible('subscriberCount') && (
                            <SortableHeader 
                                label="Subscribers" 
                                sortKey="subscriberCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[120px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                            />
                        )}
                        {isVisible('viewCount') && (
                            <SortableHeader 
                                label="Total Views" 
                                sortKey="viewCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[120px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            />
                        )}
                        {isVisible('videoCount') && (
                            <SortableHeader 
                                label="Total Videos" 
                                sortKey="videoCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[120px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                            />
                        )}
                        {isVisible('newestVideo') && (
                            <SortableHeader 
                                label="Newest Video" 
                                sortKey="newestVideoDate" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/6"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        )}
                        {isVisible('oldestVideo') && (
                            <SortableHeader 
                                label="Oldest Video" 
                                sortKey="oldestVideoDate" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/6"
                                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/30">
                    {channels.map((channel) => {
                        const isTerminated = channel.status === 'terminated';
                        const isSelected = selectedIds.includes(channel.id);

                        const isRecentlyActive = channel.newestVideo?.publishedAt 
                            ? (Date.now() - new Date(channel.newestVideo.publishedAt).getTime()) < 24 * 60 * 60 * 1000
                            : false;

                        return (
                            <tr 
                                key={channel.id} 
                                className={`group transition-all duration-200 ${isTerminated ? 'opacity-60 bg-red-900/10' : 'hover:bg-white/[0.03]'} ${isSelected ? 'bg-indigo-900/20' : ''}`}
                                onClick={(e) => {
                                    if (!(e.target as HTMLElement).closest('.click-navigate')) {
                                        onToggleRow(channel.id);
                                    }
                                }}
                            >
                                <td className="px-4 py-2 align-middle w-12 sticky left-0 z-10 bg-inherit">
                                    <CircularCheckbox 
                                        checked={isSelected} 
                                        onChange={() => onToggleRow(channel.id)} 
                                        onClick={(e) => e.stopPropagation()} 
                                    />
                                </td>
                                {isVisible('title') && (
                                    <td className="px-4 py-2 align-middle whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div 
                                                className="flex-shrink-0 h-10 w-10 relative cursor-pointer group/avatar no-row-click click-navigate"
                                                onClick={(e) => { e.stopPropagation(); !isTerminated && onSelect(channel.id); }}
                                            >
                                                <img className={`h-10 w-10 rounded-full border-2 transition-all duration-300 ${isTerminated ? 'border-red-500 grayscale' : 'border-gray-700 group-hover/avatar:border-indigo-500 group-hover/avatar:scale-105'} ${isRecentlyActive ? 'active-pulse ring-2 ring-green-500/40' : ''}`} src={channel.thumbnailUrl} alt="" />
                                                {isRecentlyActive && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f172a] shadow-sm z-10"></span>
                                                )}
                                                {isTerminated && (
                                                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1 rounded font-bold">DEAD</div>
                                                )}
                                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/avatar:opacity-100 rounded-full transition-opacity"></div>
                                            </div>
                                            <div className="ml-4 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className={`text-[13px] font-bold truncate max-w-[150px] transition-colors click-navigate leading-snug ${isTerminated ? 'text-red-400 cursor-not-allowed' : 'text-gray-200 group-hover:text-indigo-400 cursor-pointer'}`} 
                                                        onClick={() => !isTerminated && onSelect(channel.id)} 
                                                        title={isTerminated ? "Channel Terminated/Not Found" : channel.title}
                                                    >
                                                        {channel.title}
                                                    </div>
                                                    {isRecentlyActive && (
                                                        <div className="flex items-center flex-shrink-0 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                                                            <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">New</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[9px] text-gray-500 font-mono truncate mt-0.5 opacity-60" title={`Channel ID: ${channel.id}`}>
                                                    {channel.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                )}
                                {isVisible('publishedAt') && (
                                    <td className="px-4 py-2 align-middle whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium text-gray-300">{new Date(channel.publishedAt).toLocaleDateString()}</span>
                                            <span className="text-[9px] text-gray-500 opacity-60">{new Date(channel.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                )}
                                {isVisible('subscriberCount') && (
                                    <td className="px-4 py-2 align-middle">
                                        <ModernStat 
                                            value={parseInt(channel.subscriberCount, 10)} 
                                            max={maxValues.subs} 
                                            label={formatNumber(channel.subscriberCount)}
                                            rawValue={channel.subscriberCount}
                                            gradientClass="bg-gradient-to-r from-indigo-500 to-violet-400"
                                        />
                                    </td>
                                )}
                                {isVisible('viewCount') && (
                                    <td className="px-4 py-2 align-middle">
                                        <ModernStat 
                                            value={parseInt(channel.viewCount, 10) || 0} 
                                            max={maxValues.views} 
                                            label={formatNumber(channel.viewCount)}
                                            rawValue={channel.viewCount}
                                            gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                                        />
                                    </td>
                                )}
                                {isVisible('videoCount') && (
                                     <td className="px-4 py-2 align-middle">
                                        <ModernStat 
                                            value={parseInt(channel.videoCount, 10) || 0} 
                                            max={maxValues.videos} 
                                            label={formatNumber(channel.videoCount)}
                                            rawValue={channel.videoCount}
                                            gradientClass="bg-gradient-to-r from-purple-500 to-fuchsia-400"
                                        />
                                    </td>
                                )}
                                {isVisible('newestVideo') && (
                                    <td className="px-4 py-2 align-middle">
                                        {isTerminated ? <span className="text-[11px] text-red-500 italic">Unavailable</span> : <MiniVideoDisplay video={channel.newestVideo} type="Newest" />}
                                    </td>
                                )}
                                {isVisible('oldestVideo') && (
                                    <td className="px-4 py-2 align-middle">
                                        {isTerminated ? <span className="text-[11px] text-red-500 italic">Unavailable</span> : <MiniVideoDisplay video={channel.oldestVideo} type="Oldest" />}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};