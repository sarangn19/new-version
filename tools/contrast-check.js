const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const num = parseInt(hex,16);
  return [(num>>16)&255, (num>>8)&255, num&255];
}

function srgbToLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
}

function luminance(rgb) {
  return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]);
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeRGBAOver(bgRgb, fgRgb, alpha) {
  // fgRgb and bgRgb are [r,g,b] 0-255, alpha 0-1
  return [
    Math.round((1 - alpha) * bgRgb[0] + alpha * fgRgb[0]),
    Math.round((1 - alpha) * bgRgb[1] + alpha * fgRgb[1]),
    Math.round((1 - alpha) * bgRgb[2] + alpha * fgRgb[2])
  ];
}

function findMinAlphaForContrast(fgRgb, bgRgb, requiredRatio) {
  // Only valid when fg is blended over some background and compared to that same background.
  // We'll search alpha from 0 to 1 for which contrast(composite, bg) >= requiredRatio
  for (let a = 0; a <= 1.0001; a += 0.01) {
    const comp = compositeRGBAOver(bgRgb, fgRgb, a);
    const ratio = contrastRatio(comp, bgRgb);
    if (ratio >= requiredRatio) return Number(a.toFixed(2));
  }
  return null;
}

// Read db.html
const dbPath = path.resolve(__dirname, '..', 'db.html');
const html = fs.readFileSync(dbPath, 'utf8');

// Extract :root variables (simple regex)
const rootMatch = html.match(/:root\s*\{([\s\S]*?)\}/m);
const vars = {};
if (rootMatch) {
  const body = rootMatch[1];
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(body))) {
    vars[m[1]] = m[2].trim();
  }
}

// Helper to parse color token (hex or rgba())
function parseColor(token) {
  token = token.trim();
  if (token.startsWith('rgba')) {
    const nums = token.match(/rgba\(([^)]+)\)/)[1].split(',').map(s=>s.trim());
    return {r: Number(nums[0]), g: Number(nums[1]), b: Number(nums[2]), a: Number(nums[3])};
  }
  if (token.startsWith('rgb')) {
    const nums = token.match(/rgb\(([^)]+)\)/)[1].split(',').map(s=>s.trim());
    return {r: Number(nums[0]), g: Number(nums[1]), b: Number(nums[2]), a: 1};
  }
  if (token.startsWith('#')) {
    const [r,g,b] = hexToRgb(token);
    return {r,g,b,a:1};
  }
  return null;
}

// Known mappings for common Tailwind color shortcuts used in the file (approximate Tailwind v3 palette)
const tailwindMap = {
  'red-400':'#fb7185',
  'blue-400':'#60a5fa',
  'teal-400':'#2dd4bf',
  'yellow-400':'#facc15',
  'green-400':'#34d399',
  'green-500':'#10b981'
};

// Compute a set of checks we want to run
const checks = [];

// base backgrounds
const bgDark1 = vars['bg-dark-1'] ? parseColor(vars['bg-dark-1']) : parseColor('#1F1F1F');
const bgDark2 = vars['bg-dark-2'] ? parseColor(vars['bg-dark-2']) : parseColor('#1A1A1A');
const textFaded = vars['text-faded'] ? parseColor(vars['text-faded']) : {r:255,g:255,b:255,a:0.5};

// Add checks: white text on bg-dark-1 and -2
checks.push({fg:{r:255,g:255,b:255,a:1}, bg:bgDark1, name:'Primary white on bg-dark-1'});
checks.push({fg:{r:255,g:255,b:255,a:1}, bg:bgDark2, name:'Primary white on bg-dark-2'});
// semi-transparent white variants used in file (text-white/70 etc.)
checks.push({fg:{r:255,g:255,b:255,a:0.7}, bg:bgDark1, name:'text-white/70 on bg-dark-1'});
checks.push({fg:{r:255,g:255,b:255,a:0.7}, bg:bgDark2, name:'text-white/70 on bg-dark-2'});
checks.push({fg:textFaded, bg:bgDark1, name:'--text-faded (50% white) on bg-dark-1'});
checks.push({fg:textFaded, bg:bgDark2, name:'--text-faded (50% white) on bg-dark-2'});

// Also check teal-primary (variable) as foreground on dark backgrounds (e.g., tags)
if (vars['teal-primary']) {
  const t = parseColor(vars['teal-primary']);
  checks.push({fg:t,bg:bgDark2,name:'--teal-primary on bg-dark-2'});
  checks.push({fg:t,bg:bgDark1,name:'--teal-primary on bg-dark-1'});
}

// Check some Tailwind colors used in tags/icons
['red-400','blue-400','teal-400','yellow-400','green-400','green-500'].forEach(k=>{
  const hex = tailwindMap[k];
  if (hex) checks.push({fg:parseColor(hex), bg:bgDark2, name:`${k} on bg-dark-2`} );
});

// Evaluate each check and report ratios plus suggestions
function rgbaToArray(c){ return [c.r,c.g,c.b]; }

console.log('Contrast scan report for db.html (WCAG AA target 4.5:1 for normal text)\n');

checks.forEach(ch => {
  const fg = ch.fg;
  const bg = ch.bg;
  let composite;
  if (fg.a !== undefined && fg.a < 1) {
    composite = compositeRGBAOver(rgbaToArray(bg), rgbaToArray(fg), fg.a);
  } else {
    composite = rgbaToArray(fg);
  }
  const ratio = contrastRatio(composite, rgbaToArray(bg));
  const meets = ratio >= 4.5;
  const meetsLarge = ratio >= 3.0;
  console.log(`${ch.name}: contrast = ${ratio.toFixed(2)} :1 -> ${meets ? 'PASS' : (meetsLarge? 'FAIL (Pass large text only)' : 'FAIL (needs change)')}`);

  if (!meets) {
    // If fg is white-ish semi-transparent, try to find min alpha for white to meet 4.5
    if (fg.r===255 && fg.g===255 && fg.b===255) {
      const minAlpha = findMinAlphaForContrast([255,255,255], rgbaToArray(bg), 4.5);
      if (minAlpha !== null) {
        console.log(`  Suggestion: increase white opacity to at least ${minAlpha} (e.g. rgba(255,255,255,${minAlpha})) to reach 4.5:1 on this background.`);
      } else {
        console.log('  Suggestion: use pure white (#FFFFFF) or a lighter color for stronger contrast.');
      }
    } else {
      console.log('  Suggestion: adjust foreground color to a lighter shade or use white for high-contrast elements. Consider using CSS variables for consistent contrast tuning.');
    }
  }
});

console.log('\nNotes:\n- This scan focused on CSS variables and common white-opacity text usages.\n- Tailwind color mappings are approximate; for exact results, replace utility classes with CSS variables (e.g., --tag-color) or provide explicit hex colors.\n- I can update the CSS variables in db.html to suggested rgba() values programmatically if you want me to apply fixes.');
