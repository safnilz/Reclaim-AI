const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Branding
  { regex: /Reclaim AI/gi, replace: 'CRM AI Assistant' },
  { regex: /ReClaim AI/gi, replace: 'CRM AI Assistant' },
  { regex: /groq/gi, replace: 'AI' },
  { regex: /Powered by Groq/gi, replace: 'Powered by AI' },
  
  // Theme
  { regex: /bg-slate-950/g, replace: 'bg-slate-50' },
  { regex: /bg-slate-900/g, replace: 'bg-white' },
  { regex: /border-slate-800/g, replace: 'border-slate-200' },
  { regex: /border-slate-700/g, replace: 'border-slate-300' },
  { regex: /text-slate-400/g, replace: 'text-slate-500' },
  { regex: /text-slate-300/g, replace: 'text-slate-600' },
  { regex: /text-white/g, replace: 'text-slate-900' },
  { regex: /text-slate-50/g, replace: 'text-slate-900' },
  { regex: /bg-slate-800/g, replace: 'bg-slate-100' },
  
  // Currency in chart
  { regex: /`\$\${v\/1000}k`/g, replace: '`AED ${v/1000}k`' },
  { regex: /`\$\${value\/1000}k`/g, replace: '`AED ${value/1000}k`' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Mass replace complete.');
