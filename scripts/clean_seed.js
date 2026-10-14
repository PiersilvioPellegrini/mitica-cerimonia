const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/seed.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    // Remove fields
    content = content.replace(/.*price_list:.*\n/g, '');
    content = content.replace(/.*price_sale:.*\n/g, '');
    content = content.replace(/.*cost_price:.*\n/g, '');
    content = content.replace(/.*season:.*\n/g, '');
    content = content.replace(/.*collezione:.*\n/g, '');

    fs.writeFileSync(filePath, content);
    console.log(`Cleaned seed.js. Reduced from ${originalLength} to ${content.length} chars.`);
} catch (err) {
    console.error("Error cleaning seed.js:", err);
    process.exit(1);
}
