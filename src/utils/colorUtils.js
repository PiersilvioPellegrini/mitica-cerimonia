export const colorMap = {
    'Bianco': 'bg-white border-gray-200',
    'Nero': 'bg-black border-black',
    'Blu Notte': 'bg-[#191970] border-[#191970]',
    'Blu Reale': 'bg-[#4169E1] border-[#4169E1]',
    'Grigio': 'bg-gray-500 border-gray-500',
    'Rosso': 'bg-red-600 border-red-600',
    'Verde': 'bg-green-700 border-green-700',
    'Rosa': 'bg-pink-300 border-pink-300',
    'Azzurro': 'bg-sky-400 border-sky-400',
    'Viola': 'bg-purple-700 border-purple-700',
    'Oro': 'bg-[#FFD700] border-[#FFD700]',
    'Argento': 'bg-[#C0C0C0] border-[#C0C0C0]',
    'Avorio': 'bg-[#FFFFF0] border-gray-200'
};

export const getColorClasses = (color) => {
    return colorMap[color] || 'bg-gray-200 border-gray-200';
};

export const normalizeColor = (c) => {
    if (!c || typeof c !== 'string') return null;
    const trimmed = c.trim();
    if (!trimmed) return null;
    // Capitalize first letter, lowercase the rest
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Chromatic Sort Order (Light -> Warm -> Cool -> Dark)
const colorOrder = [
    'Bianco', 'Avorio', 'Panna', 'Champagne', 'Crema',
    'Beige', 'Sabbia',
    'Oro', 'Giallo',
    'Arancio', 'Arancione', 'Salmone', 'Corallo',
    'Rosa', 'Cipria', 'Pesca', 'Fucsia', 'Magenta',
    'Rosso', 'Bordeaux', 'Amaranto',
    'Viola', 'Lilla', 'Glicine', 'Prugna',
    'Blu', 'Blu Notte', 'Blu Reale', 'Navy', 'Zaffiro',
    'Azzurro', 'Celeste', 'Polvere', 'Turchese', 'Tiffany',
    'Verde', 'Smeraldo', 'Verde Acqua', 'Salvia', 'Oliva',
    'Marrone', 'Cioccolato', 'Terra',
    'Grigio', 'Antracite', 'Perla',
    'Argento',
    'Nero'
];

export const getColorSortIndex = (color) => {
    if (!color) return 999;
    // Normalize string: uppercase first letter, trim
    const normalized = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();

    // Find index using partial matching if exact match fails
    const index = colorOrder.findIndex(c =>
        c.toLowerCase() === color.toLowerCase() ||
        color.toLowerCase().includes(c.toLowerCase())
    );

    return index !== -1 ? index : 999; // 999 for unknown colors (put at end)
};
