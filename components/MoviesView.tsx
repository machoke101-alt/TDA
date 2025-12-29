
import React, { useState, useMemo, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { MultiSelectDropdown, Option as MultiOption } from './MultiSelectDropdown';
import { AddMovieModal } from './AddMovieModal';
import { MovieSummaryCards } from './MovieSummaryCards';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { BulkActionBar } from './BulkActionBar'; // Import BulkActionBar
import type { Movie, MovieStatus, ChannelStats, AppSettings } from '../types';

type SortKey = 'name' | 'addedAt' | 'status' | 'note';
type SortDirection = 'asc' | 'desc';

interface MoviesViewProps {
    movies: Movie[];
    channels: ChannelStats[];
    onAddMovies: (names: string) => void;
    onUpdateMovie: (id: string, updates: Partial<Movie>) => void;
    onBulkUpdateMovieStatus: (ids: string[], status: MovieStatus) => void; // Kept for appData interaction
    onDeleteMovie: (id: string) => void; // Kept for appData interaction
    settings: AppSettings;
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>; // Added setter to enable internal movie state manipulation
}

export const STATUS_OPTIONS: { id: MovieStatus; label: string; colorClass: string; hex: string }[] = [
    { id: 'Playlist', label: 'Playlist', colorClass: 'text-blue-400 bg-blue-400/5 border-blue-400/20', hex: '#60a5fa' },
    { id: 'Download', label: 'Download', colorClass: 'text-purple-400 bg-purple-400/5 border-purple-400/20', hex: '#c084fc' },
    { id: 'Copyright Check', label: 'Copyright Check', colorClass: 'text-yellow-500 bg-yellow-500/5 border-yellow-500/30', hex: '#facc15' },
    { id: 'Visual Copyright', label: 'Visual Copyright', colorClass: 'text-orange-400 bg-orange-400/5 border-orange-400/20', hex: '#fb923c' },
    { id: 'Audio Copyright', label: 'Audio Copyright', colorClass: 'text-pink-400 bg-pink-400/5 border-pink-400/20', hex: '#f472b6' },
    { id: 'Strike Check', label: 'Strike Check', colorClass: 'text-red-400 bg-red-400/5 border-red-400/20', hex: '#f87171' },
    { id: 'Done', label: 'Done', colorClass: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20', hex: '#34d399' },
];

const ALL_MOVIE_COLUMNS = [
    { id: 'name', label: 'Movie Title' },
    { id: 'status', label: 'Status' },
    { id: 'addedAt', label: 'Date Added' },
    { id: '3d', label: '3D Channel' },
    { id: '2d', label: '2D Channel' },
    { id: 'note', label: 'Note' },
];

const NoteInput: React.FC<{ initialValue: string, onSave: (val: string) => void }> = ({ initialValue, onSave }) => {
    const [value, setValue] = useState(initialValue);
    useEffect(() => { setValue(initialValue); }, [initialValue]);
    const handleBlur = () => { if (value !== initialValue) onSave(value); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') (e.currentTarget as HTMLElement).blur(); };

    return (
        <input 
            type="text" 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            onBlur={handleBlur} 
            onKeyDown={handleKeyDown} 
            onClick={(e) => e.stopPropagation()}
            placeholder="Add a note..."
            className="w-full bg-transparent border border-transparent hover:border-white/5 focus:border-indigo-500/50 rounded-lg px-3 py-1.5 text-[12px] text-gray-300 focus:text-white placeholder-gray-700 focus:outline-none transition-all"
        />
    );
};

const getChannelColorClass = (id: string) => {
    const colors = ['text-indigo-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-sky-400', 'text-fuchsia-400'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const CircularCheckbox: React.FC<{ checked: boolean, onChange: () => void, onClick?: (e: React.MouseEvent) => void }> = ({ checked, onChange, onClick }) => (
    <div className="relative flex items-center justify-center" onClick={onClick}>
        <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none h-5 w-5 border-2 border-gray-700 rounded-full bg-gray-800/50 checked:bg-indigo-500 checked:border-indigo-500 hover:border-gray-600 focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer" />
        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
);

const SortableHeader: React.FC<{
    label: string; 
    sortKey: SortKey; 
    currentSort: { key: SortKey; direction: SortDirection }; 
    onSort: (key: SortKey) => void; 
    className?: string; 
    align?: 'left' | 'right' | 'center'; 
    icon?: React.ReactNode;
}> = ({ label, sortKey, currentSort, onSort, className = "", align = 'left', icon }) => {
    const isActive = currentSort.key === sortKey;
    
    return (
        <th 
            className={`px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-white transition-all font-sans ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                <div className="flex items-center gap-1.5 opacity-90">
                    {icon}
                    <span>{label}</span>
                </div>
                <div className="flex flex-col -space-y-1 w-2">
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'asc' ? 'text-indigo-400' : 'text-gray-700'}`}>▲</span>
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'desc' ? 'text-indigo-400' : 'text-gray-700'}`}>▼</span>
                </div>
            </div>
        </th>
    );
};

export const MoviesView: React.FC<MoviesViewProps> = ({ movies, channels, onAddMovies, onUpdateMovie, onBulkUpdateMovieStatus, onDeleteMovie, settings, setMovies }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'addedAt', direction: 'desc' });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_MOVIE_COLUMNS.map(c => c.id));
    
    const [activeBulkMenu, setActiveBulkMenu] = useState<'status' | '3d' | '2d' | null>(null);
    const [bulkSearchTerm, setBulkSearchTerm] = useState('');
    const [pendingBulkValue, setPendingBulkValue] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selected3DIds, setSelected3DIds] = useState<string[]>([]);
    const [selected2DIds, setSelected2DIds] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [timeFilter, setTimeFilter] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.rowsPerPage || 100;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selected3DIds, selected2DIds, selectedStatuses, timeFilter]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeBulkMenu) {
                    setActiveBulkMenu(null);
                    setPendingBulkValue(null);
                } else if (selectedIds.length > 0) {
                    setSelectedIds([]);
                }
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [activeBulkMenu, selectedIds.length]);

    const singleSelectChannelOptions = useMemo(() => channels.map(c => ({ id: c.id, label: c.title, colorClass: getChannelColorClass(c.id) })), [channels]);
    const statusDropdownOptions: MultiOption[] = useMemo(() => STATUS_OPTIONS.map(s => ({ id: s.id, label: s.label, color: s.hex })), []);

    const timeOptions: MultiOption[] = [
        { id: 'today', label: 'Added Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

    const filteredAndSortedMovies = useMemo(() => {
        let result = movies.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            const movie3DIds = m.channel3DIds || (m.channel3DId ? [m.channel3DId] : []);
            const movie2DIds = m.channel2DIds || (m.channel2DId ? [m.channel2DId] : []);
            const matches3D = selected3DIds.length === 0 || movie3DIds.some(id => selected3DIds.includes(id));
            const matches2D = selected2DIds.length === 0 || movie2DIds.some(id => selected2DIds.includes(id));
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(m.status);

            let matchesTime = true;
            if (timeFilter.length > 0) {
                const addedDate = new Date(m.addedAt);
                const now = new Date();
                if (timeFilter.includes('today')) matchesTime = addedDate.toDateString() === now.toDateString();
                else if (timeFilter.includes('7d')) { const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7); matchesTime = addedDate >= sevenDaysAgo; }
                else if (timeFilter.includes('30d')) { const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30); matchesTime = addedDate >= thirtyDaysAgo; }
            }
            return matchesSearch && matches3D && matches2D && matchesStatus && matchesTime;
        });

        result.sort((a, b) => {
            if (sortConfig.key === 'status') {
                const rankA = STATUS_OPTIONS.findIndex(opt => opt.id === a.status);
                const rankB = STATUS_OPTIONS.findIndex(opt => opt.id === b.status);
                const valA = rankA === -1 ? 999 : rankA;
                const valB = rankB === -1 ? 999 : rankB;
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
            let valA: any = a[sortConfig.key as keyof Movie];
            let valB: any = b[sortConfig.key as keyof Movie];
            if (sortConfig.key === 'addedAt') { valA = new Date(valA).getTime(); valB = new Date(valB).getTime(); }
            else if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = (valB || '').toLowerCase(); }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [movies, searchQuery, selected3DIds, selected2DIds, selectedStatuses, timeFilter, sortConfig]);

    const handleSort = (key: SortKey) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const handleToggleAll = () => setSelectedIds(selectedIds.length === filteredAndSortedMovies.length ? [] : filteredAndSortedMovies.map(m => m.id));
    const handleToggleRow = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

    const commitBulkStatusChange = () => { if (pendingBulkValue) { onBulkUpdateMovieStatus(selectedIds, pendingBulkValue as MovieStatus); setSelectedIds([]); setActiveBulkMenu(null); setPendingBulkValue(null); } };
    const commitBulkChannelAdd = (type: '3D' | '2D') => {
        if (pendingBulkValue) {
            const channelId = pendingBulkValue;
            setMovies(prev => prev.map(m => {
                if (selectedIds.includes(m.id)) {
                    if (type === '3D') return { ...m, channel3DIds: [channelId], channel3DId: channelId };
                    else return { ...m, channel2DIds: [channelId], channel2DId: channelId };
                }
                return m;
            }));
            selectedIds.forEach(movieId => onUpdateMovie(movieId, type === '3D' ? { channel3DIds: [channelId] } : { channel2DIds: [channelId] }));
            setSelectedIds([]); setActiveBulkMenu(null); setBulkSearchTerm(''); setPendingBulkValue(null);
        }
    };

    const filteredBulkChannels = useMemo(() => bulkSearchTerm ? singleSelectChannelOptions.filter(c => c.label.toLowerCase().includes(bulkSearchTerm.toLowerCase())) : singleSelectChannelOptions, [bulkSearchTerm, singleSelectChannelOptions]);
    const isVisible = (colId: string) => visibleColumns.includes(colId);

    const totalItems = filteredAndSortedMovies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedMovies = filteredAndSortedMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const confirmDelete = () => {
        setMovies(prev => prev.filter(m => !selectedIds.includes(m.id)));
        selectedIds.forEach(id => onDeleteMovie(id));
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fade-in w-full pb-20">
            <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-700/50 space-y-4 shadow-xl">
                <div className="flex flex-row gap-4 items-center h-11">
                    <div className="relative flex-grow h-full">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search movie..."
                            className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-[13px]"
                        />
                    </div>
                    <MultiSelectDropdown label="Columns" options={ALL_MOVIE_COLUMNS} selectedIds={visibleColumns} onChange={setVisibleColumns} className="w-40 h-full" icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2 2" /></svg>}/>
                    <button onClick={() => setIsAddModalOpen(true)} className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        Add Movie
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <MultiSelectDropdown label="Time" options={timeOptions} selectedIds={timeFilter} onChange={setTimeFilter} className="w-full h-11"/>
                    <MultiSelectDropdown label="Status" options={statusDropdownOptions} selectedIds={selectedStatuses} onChange={setSelectedStatuses} className="w-full h-11"/>
                    <MultiSelectDropdown label="3D Channels" options={singleSelectChannelOptions} selectedIds={selected3DIds} onChange={setSelected3DIds} className="w-full h-11"/>
                    <MultiSelectDropdown label="2D Channels" options={singleSelectChannelOptions} selectedIds={selected2DIds} onChange={setSelected2DIds} className="w-full h-11"/>
                </div>
            </div>

            <MovieSummaryCards movies={filteredAndSortedMovies} />

            <div className="overflow-x-auto rounded-xl shadow-xl border border-gray-700/50 bg-gray-950/20">
                <table className="min-w-full divide-y divide-gray-800/50 table-fixed">
                    <thead className="bg-gray-900/30">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                                <CircularCheckbox checked={filteredAndSortedMovies.length > 0 && selectedIds.length === filteredAndSortedMovies.length} onChange={handleToggleAll}/>
                            </th>
                            {isVisible('name') && <SortableHeader label="Movie" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="w-[200px]"/>}
                            {isVisible('status') && <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="center" className="w-[180px]"/>}
                            {isVisible('addedAt') && <SortableHeader label="Added" sortKey="addedAt" currentSort={sortConfig} onSort={handleSort} className="w-[130px]"/>}
                            {isVisible('3d') && <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider w-[180px]">3D Channel</th>}
                            {isVisible('2d') && <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider w-[180px]">2D Channel</th>}
                            {isVisible('note') && <th className="px-4 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-wider min-w-[200px]">Note</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/20">
                        {paginatedMovies.length > 0 ? paginatedMovies.map((movie) => {
                             const isSelected = selectedIds.includes(movie.id);
                             const addedDate = new Date(movie.addedAt);
                             return (
                                <tr key={movie.id} className={`group transition-all h-[54px] ${isSelected ? 'bg-indigo-900/10' : 'hover:bg-white/[0.02]'}`} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, input, .no-row-click')) handleToggleRow(movie.id); }}>
                                    <td className="px-4 py-2 align-middle w-12 sticky left-0 z-10 bg-inherit"><CircularCheckbox checked={isSelected} onChange={() => handleToggleRow(movie.id)} onClick={(e) => e.stopPropagation()}/></td>
                                    {isVisible('name') && <td className="px-4 py-2 align-middle"><div className="text-[13px] font-bold text-gray-200 truncate leading-tight" title={movie.name}>{movie.name}</div></td>}
                                    {isVisible('status') && <td className="px-4 py-2 align-middle no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={movie.status} options={STATUS_OPTIONS} onChange={(val) => onUpdateMovie(movie.id, { status: val as MovieStatus })} className="w-[160px]" variant="default"/></div></td>}
                                    {isVisible('addedAt') && (
                                        <td className="px-4 py-2 align-middle">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[11px] font-bold text-gray-200">{addedDate.toLocaleDateString('en-US')}</span>
                                                <span className="text-[9px] text-gray-600 mt-1 uppercase font-bold">{addedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('3d') && <td className="px-4 py-2 align-middle no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={movie.channel3DIds?.[0] || movie.channel3DId || ''} options={singleSelectChannelOptions} onChange={(id) => onUpdateMovie(movie.id, { channel3DIds: [id] })} placeholder="Select..." className="w-[170px]" variant="minimal"/></div></td>}
                                    {isVisible('2d') && <td className="px-4 py-2 align-middle no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={movie.channel2DIds?.[0] || movie.channel2DId || ''} options={singleSelectChannelOptions} onChange={(id) => onUpdateMovie(movie.id, { channel2DIds: [id] })} placeholder="Select..." className="w-[170px]" variant="minimal"/></div></td>}
                                    {isVisible('note') && <td className="px-4 py-2 align-middle no-row-click"><NoteInput initialValue={movie.note || ''} onSave={(val) => onUpdateMovie(movie.id, { note: val })}/></td>}
                                </tr>
                            );
                        }) : <tr><td colSpan={visibleColumns.length + 1} className="px-6 py-20 text-center text-gray-600 italic">No movies found</td></tr>}
                    </tbody>
                </table>
            </div>

            {totalItems > itemsPerPage && (
                <div className="flex justify-between items-center bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                    <div className="text-xs text-gray-500">Showing <span className="text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span>- <span className="text-gray-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-gray-300">{totalItems}</span></div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-colors">Previous</button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-colors">Next</button>
                    </div>
                </div>
            )}

            {selectedIds.length > 0 && (
                <BulkActionBar count={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={() => setIsDeleteModalOpen(true)}>
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveBulkMenu(activeBulkMenu === 'status' ? null : 'status'); setPendingBulkValue(null); }} className={`flex items-center gap-2 transition-all hover:scale-105 ${activeBulkMenu === 'status' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-bold">Status</span>
                        </button>
                        {activeBulkMenu === 'status' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col bulk-action-menu-dropdown" onClick={e => e.stopPropagation()}>
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {STATUS_OPTIONS.map(s => (
                                        <button key={s.id} onClick={() => setPendingBulkValue(s.id)} className={`w-full text-left px-4 py-2 text-[12px] flex items-center justify-between transition-colors ${pendingBulkValue === s.id ? 'bg-indigo-600/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.hex }}></span>{s.label}</div>
                                            {pendingBulkValue === s.id && <span className="text-indigo-400 font-bold">✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={commitBulkStatusChange} disabled={!pendingBulkValue} className="m-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[12px] font-bold py-2 rounded-lg shadow-lg">Save</button>
                            </div>
                        )}
                    </div>
                </BulkActionBar>
            )}

            <AddMovieModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddMovies={onAddMovies}/>
            <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} count={selectedIds.length} itemName="movie"/>
        </div>
    );
};
