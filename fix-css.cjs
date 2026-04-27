const fs = require('fs');
let css = fs.readFileSync('src/responsive-mobile.css', 'utf8');

// Replace standard CSS declarations with !important
css = css.replace(/([^\{\};]+):\s*([^;\}!]+?)(;|\s*(?=\}))/g, (match, prop, val, end) => {
  if (val.trim() === '') return match;
  if (prop.includes('/*') || prop.includes('//')) return match;
  if (val.includes('!important')) return match;
  return `${prop}: ${val.trim()} !important${end.startsWith(';') ? end : ';' + end}`;
});

fs.writeFileSync('src/responsive-mobile.css', css);
console.log('CSS updated successfully');
