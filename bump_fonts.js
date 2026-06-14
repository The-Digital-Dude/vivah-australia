const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\AI\\Vivah Australia\\apps\\web\\app\\final-homepage-dark\\client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The mapping of text sizes to bump up by 1
const sizeMap = [
  { regex: /text-\[10px\]/g, replacement: 'text-xs' },
  { regex: /text-\[11px\]/g, replacement: 'text-xs' },
  { regex: /text-xs/g, replacement: 'text-sm' },
  { regex: /text-sm/g, replacement: 'text-base' },
  { regex: /text-base/g, replacement: 'text-lg' },
  { regex: /text-lg/g, replacement: 'text-xl' },
  { regex: /text-xl/g, replacement: 'text-2xl' },
  { regex: /text-2xl/g, replacement: 'text-3xl' },
  { regex: /text-3xl/g, replacement: 'text-4xl' },
  { regex: /text-4xl/g, replacement: 'text-5xl' },
  { regex: /text-5xl/g, replacement: 'text-6xl' },
  { regex: /text-6xl/g, replacement: 'text-7xl' },
  { regex: /text-7xl/g, replacement: 'text-8xl' }
];

// We must be careful not to replace text-sm inside text-sm:something or text-xs inside text-xs-something.
// Actually, tailwind text sizing classes are exactly like `text-sm` or `sm:text-sm` or `hover:text-sm`.
// Let's use negative lookahead and lookbehind to ensure exact matches of the size name.
const safeReplace = (content) => {
  let newContent = content;
  // Apply in reverse order so we don't double bump!
  // Wait, if we replace text-xs with text-sm, the next pass replacing text-sm with text-base will double bump it!
  // So we need to do it in a single pass with a replacer function.
  
  const replacerRegex = /(?:^|\s|[:"'])text-(?:\[10px\]|\[11px\]|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)(?:\s|[:"']|$)/g;
  
  // Wait, the boundaries are tricky. 
  // Better approach: regex to match `text-[size]` with boundaries
  const classRegex = /(?<=^|\s|[:"'])text-(?:\[10px\]|\[11px\]|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)(?=$|\s|[:"'])/g;
  
  const map = {
    'text-[10px]': 'text-xs',
    'text-[11px]': 'text-xs',
    'text-xs': 'text-sm',
    'text-sm': 'text-base',
    'text-base': 'text-lg',
    'text-lg': 'text-xl',
    'text-xl': 'text-2xl',
    'text-2xl': 'text-3xl',
    'text-3xl': 'text-4xl',
    'text-4xl': 'text-5xl',
    'text-5xl': 'text-6xl',
    'text-6xl': 'text-7xl',
    'text-7xl': 'text-8xl'
  };

  newContent = newContent.replace(classRegex, match => map[match] || match);
  return newContent;
};

content = safeReplace(content);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully bumped font sizes in client.tsx');
