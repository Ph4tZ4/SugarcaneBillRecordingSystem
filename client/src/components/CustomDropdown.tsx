import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, placeholder = 'Select option' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-sm transition-all duration-200 ${isOpen ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300 hover:border-green-400'
                    }`}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    {options.length > 0 ? (
                        <div className="py-1">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-green-50 transition-colors ${value === option ? 'text-green-700 bg-green-50 font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    <span>{option}</span>
                                    {value === option && <Check size={16} className="text-green-600" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            ไม่มีข้อมูล
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
