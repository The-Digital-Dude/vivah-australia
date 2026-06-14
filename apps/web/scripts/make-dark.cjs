const fs = require('fs');

const path = 'app/final-homepage-dark/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change main background
content = content.replace(/bg-brand-ivory/g, 'bg-[#121212]');

// Change text colors
content = content.replace(/text-brand-charcoal/g, 'text-brand-ivory');
content = content.replace(/text-gray-500/g, 'text-white/60');
content = content.replace(/text-gray-600/g, 'text-white/60');
content = content.replace(/text-gray-900/g, 'text-white');
content = content.replace(/text-brand-charcoal\/70/g, 'text-brand-ivory/70');

// Change component backgrounds
content = content.replace(/bg-white rounded-2xl shadow/g, 'bg-[#1A1A1A] rounded-2xl shadow');
content = content.replace(/bg-white p-6/g, 'bg-[#1A1A1A] p-6');
content = content.replace(/bg-white p-8/g, 'bg-[#1A1A1A] p-8');
content = content.replace(/bg-white rounded-\[20px\]/g, 'bg-[#1A1A1A] rounded-[20px]');
content = content.replace(/bg-white border-brand-gold\/20/g, 'bg-[#1A1A1A] border-white/10');
content = content.replace(/bg-white border-2 border-brand-gold/g, 'bg-[#1A1A1A] border-2 border-brand-gold');

// Select and Input fields
content = content.replace(/bg-white px-4/g, 'bg-[#2A2A2A] px-4 text-white');
content = content.replace(/border-gray-200/g, 'border-white/10');
content = content.replace(/border-gray-100/g, 'border-white/5');

// Pricing cards
content = content.replace(/bg-white border border-gray-100/g, 'bg-[#1A1A1A] border border-white/10');
content = content.replace(/bg-white border-2 border-brand-maroon/g, 'bg-[#1A1A1A] border-2 border-brand-maroon');

// Add link to Navbar
const navLink = `
            <Link href="/final-homepage" className="hidden sm:flex items-center justify-center rounded border border-white/40 bg-transparent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
              Light Mode
            </Link>`;
content = content.replace('{/* Right Buttons */}', '{/* Right Buttons */}' + navLink);

fs.writeFileSync(path, content, 'utf8');
console.log('Dark mode script finished.');
