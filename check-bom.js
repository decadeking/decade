const fs = require('fs');
const path = require('path');

function checkBOM(dir) {
  const files = fs.readdirSync(dir);
  const bomFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      bomFiles.push(...checkBOM(filePath));
    } else if (file.endsWith('.md')) {
      const bytes = fs.readFileSync(filePath);
      if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        bomFiles.push(filePath);
      }
    }
  });
  
  return bomFiles;
}

const bomFiles = checkBOM('c:\\Users\\decade\\Desktop\\code-shine');
console.log('Files with BOM:');
bomFiles.forEach(f => console.log(f));
