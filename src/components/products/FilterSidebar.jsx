import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { getColorClasses } from '../../utils/colorUtils';

export default function FilterSidebar({
    filters,
    setFilters,
    isOpen,
    onClose,
    isPromo,
    initialCategory,
    availableSubcategories = [],
    availableColors = [],
    availableProductTypes = []
}) {
    // Logic: If 'Scarpe' is selected, show shoe sizes. Else show clothing sizes.



    // Body Scroll Lock for Mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}></div>
            )}

            <div className={`
        fixed inset-y-0 left-0 bg-white shadow-2xl transform transition-transform duration-300 z-[120] w-80 p-8 overflow-y-auto rounded-r-[2rem]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:w-64 md:block md:shadow-none md:p-0 md:bg-transparent md:h-auto md:rounded-none md:border-none
      `}>
                <div className="flex justify-between items-center mb-8 md:hidden">
                    <h2 className="text-2xl font-serif text-primary-900">Filtri</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-primary-600"><X size={24} /></button>
                </div>

                <div className="space-y-10">




                    {/* Reparto Filter (Only for Promo) */}
                    {isPromo && (
                        <div className="mb-8">
                            <h3 className="font-serif text-xl mb-4 text-primary-900 border-b border-gray-100 pb-2">Reparto</h3>
                            <div className="flex flex-col gap-3 pl-2">
                                {['Donna', 'Uomo'].map(dept => {
                                    const isSelected = filters.subcategories.includes(dept);
                                    return (
                                        <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        // Toggle logic for subcategories which act as Departments in Promo
                                                        subcategories: isSelected
                                                            ? prev.subcategories.filter(c => c !== dept)
                                                            : [...prev.subcategories, dept]
                                                    }));
                                                }}
                                                className="w-5 h-5 rounded-md border-gray-300 text-violet-600 focus:ring-violet-500 transition-all checked:scale-110"
                                            />
                                            <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-violet-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                {dept}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Color Filter - Hidden in Promo mode */}
                    {!isPromo && availableColors.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-serif text-xl mb-4 text-primary-900 border-b border-gray-100 pb-2">Colori</h3>
                            <div className="flex flex-wrap gap-2 pl-2">
                                {availableColors.map(color => {
                                    // ... existing map logic ...
                                    const isSelected = filters.colors.includes(color);
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    colors: isSelected
                                                        ? prev.colors.filter(c => c !== color)
                                                        : [...prev.colors, color]
                                                }));
                                            }}
                                            className={`
                                                px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                                ${isSelected
                                                    ? 'bg-violet-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                                            `}
                                        >
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Product Type Filter (Abiti/Completi) - Conditional Visibility */}
                    {/* Hide if Uomo/Sposo is selected OR if in Promo mode with Uomo selected */}
                    {(() => {
                        const isUomoSelected = filters.categories.includes('Uomo') || filters.categories.includes('Sposo') || filters.subcategories.includes('Uomo');
                        const showTypeFilter = !isUomoSelected && availableProductTypes.length > 1;

                        return showTypeFilter ? (
                            <div className="mb-8">
                                <h3 className="font-serif text-xl mb-4 text-primary-900 border-b border-gray-100 pb-2">Tipologia</h3>
                                <div className="space-y-2 pl-2">
                                    {availableProductTypes.map(type => (
                                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                value={type}
                                                checked={filters.product_types.includes(type)}
                                                onChange={(e) => {
                                                    const { checked, value } = e.target;
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        product_types: checked
                                                            ? [...prev.product_types, value]
                                                            : prev.product_types.filter(t => t !== value)
                                                    }));
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                            />
                                            <span className={`text-sm font-medium transition-colors ${filters.product_types.includes(type) ? 'text-violet-900 font-bold' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                                {type}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    <button
                        onClick={() => setFilters({
                            categories: initialCategory ? [initialCategory] : [],
                            subcategories: [],
                            target: '',
                            sizes: [],
                            colors: [],
                            season: [],
                            minPrice: '',
                            maxPrice: '',
                            product_types: []
                        })}
                        className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] items-center justify-center flex font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                    >
                        Resetta Filtri
                    </button>
                </div>
            </div >
        </>
    );
}
