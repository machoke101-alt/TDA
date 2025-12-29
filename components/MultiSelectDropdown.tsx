

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Fix: Thêm thuộc tính icon vào interface Option để giải quyết lỗi type khi sử dụng icon trong các tùy chọn dropdown
export interface Option {
    id: string;
    label: string;
    color?: string; // Optional color dot
    icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    icon?: React.ReactNode;
    className?: string; // Added to support custom widths
    footer?: React.ReactNode; // New prop for custom footer actions
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    label, 
    options, 
    selectedIds, 
    onChange,
    icon,
    className = "w-full md:w-56", // Default fallback
    footer
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(item => item !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.id));
        }
    };

    const isAllSelected = options.length > 0 && selectedIds.length === options.length;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-11 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="truncate">
                        {selectedIds.length === 0 
                            ? label 
                            : selectedIds.length === options.length 
                                ? `All ${label.replace('All ', '')}`
                                : `${selectedIds.length} selected`}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl animate-fade-in-down overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-700">
                        <div className="relative">
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-[13px] text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {/* Select All Option */}
                        {searchTerm === '' && options.length > 0 && (
                            <div 
                                onClick={handleSelectAll}
                                className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                                    {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="text-[13px] text-white font-medium">Select All</span>
                            </div>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = selectedIds.includes(option.id);
                                return (
                                    <div 
                                        key={option.id}
                                        onClick={() => toggleSelection(option.id)}
                                        className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        {/* Hiển thị icon của option nếu có */}
                                        {option.icon && (
                                            <div className="text-gray-500 group-hover:text-white transition-colors mr-2 flex-shrink-0">
                                                {option.icon}
                                            </div>
                                        )}
                                        {option.color && (
                                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: option.color }}></span>
                                        )}
                                        <span className="text-[13px] text-gray-300 group-hover:text-white truncate">{option.label}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-[13px] text-gray-500 text-center">No results found</div>
                        )}
                    </div>

                    {/* Custom Footer Action */}
                    {footer && (
                        <div className="border-t border-gray-700 bg-gray-900/50">
                            {footer}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};