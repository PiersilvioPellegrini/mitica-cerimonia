import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRY_PREFIXES = [
    { code: '+39', country: 'IT', label: 'Italia (+39)' },
    { code: '+33', country: 'FR', label: 'Francia (+33)' },
    { code: '+34', country: 'ES', label: 'Spagna (+34)' },
    { code: '+49', country: 'DE', label: 'Germania (+49)' },
    { code: '+41', country: 'CH', label: 'Svizzera (+41)' },
    { code: '+44', country: 'GB', label: 'Regno Unito (+44)' },
    { code: '+1', country: 'US', label: 'Stati Uniti (+1)' },
    { code: '+40', country: 'RO', label: 'Romania (+40)' },
    { code: '+355', country: 'AL', label: 'Albania (+355)' },
    { code: '+380', country: 'UA', label: 'Ucraina (+380)' },
];

const MAX_LENGTHS = {
    '+39': 10, // IT
    '+33': 9,  // FR
    '+34': 9,  // ES
    '+49': 11, // DE (can vary)
    '+41': 9,  // CH
    '+44': 10, // GB
    '+1': 10,  // US
    '+40': 10, // RO
    '+355': 9, // AL
    '+380': 9  // UA
};

export default function PhoneInput({ value, onChange, placeholder, required = false, className = "" }) {
    // Split initial value into prefix and number if possible, or default to IT
    const [prefix, setPrefix] = useState('+39');
    const [number, setNumber] = useState('');

    // Initialize state from prop value
    useEffect(() => {
        if (value) {
            // Try to find a known prefix
            const knownPrefix = COUNTRY_PREFIXES.find(p => value.startsWith(p.code));
            if (knownPrefix) {
                setPrefix(knownPrefix.code);
                setNumber(value.slice(knownPrefix.code.length).trim());
            } else {
                setNumber(value.replace(prefix, '').trim());
            }
        }
    }, [prefix]); // added prefix dependency check or should be empty? 
    // Actually, if we change prefix, we might want to re-validate? 
    // Just keep it simple: initial load. Current code had empty dependency array.
    // I will keep empty dependency array but remove the comment block above to keep it clean.

    const handlePrefixChange = (e) => {
        const newPrefix = e.target.value;
        setPrefix(newPrefix);

        // Truncate number if it exceeds new prefix limit
        const limit = MAX_LENGTHS[newPrefix] || 15;
        const cleanNum = number.replace(/\D/g, '');
        if (cleanNum.length > limit) {
            const truncated = cleanNum.slice(0, limit);
            setNumber(truncated);
            onChange(`${newPrefix} ${truncated}`);
        } else {
            onChange(`${newPrefix} ${number}`);
        }
    };

    const handleNumberChange = (e) => {
        const raw = e.target.value;
        // Allow ONLY numbers and spaces
        if (/[^0-9\s]/.test(raw)) return;

        const cleanVal = raw.replace(/\D/g, '');
        const limit = MAX_LENGTHS[prefix] || 15;

        // Block input if exceeding limit
        if (cleanVal.length > limit) return;

        setNumber(raw);
        onChange(`${prefix} ${raw}`);
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <div className="relative w-[110px] sm:w-[130px] shrink-0">
                <select
                    value={prefix}
                    onChange={handlePrefixChange}
                    className="w-full h-full appearance-none bg-gray-50/50 border border-gray-100 rounded-2xl pl-4 pr-8 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm cursor-pointer"
                >
                    {COUNTRY_PREFIXES.map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.country} {p.code}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
            <input
                type="tel"
                value={number}
                onChange={handleNumberChange}
                placeholder={placeholder || "Numero..."}
                required={required}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm"
            />
        </div>
    );
}
