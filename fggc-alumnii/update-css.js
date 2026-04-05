const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend', 'css', 'styles.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Replace color naming and values
content = content.replace(/--secondary-yellow/g, '--secondary-skyblue');
// It was initially set to #FFC72C, let's change to a warm sky blue.
content = content.replace(/--secondary-skyblue:\s*#FFC72C/g, '--secondary-skyblue: #7EC8E3');

// Warming up the theme
content = content.replace(/--bg-light:\s*#f4f6f8/g, '--bg-light: #FDFBF7');
content = content.replace(/--bg-white:\s*#ffffff/g, '--bg-white: #FFFCF8');

fs.writeFileSync(cssPath, content);
console.log('CSS updated successfully.');
