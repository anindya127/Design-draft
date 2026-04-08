const fs = require('fs');
const content = fs.readFileSync('C:/Users/vipar/OneDrive/Desktop/GCSS/Gcss_website/Design/Untitled Diagram.drawio.html', 'utf8');

// Build a map of id -> value
const cellRegex = /id=\\&quot;(.*?)\\&quot;[^>]*?value=\\&quot;(.*?)\\&quot;/g;
const cellRegex2 = /value=\\&quot;(.*?)\\&quot;[^>]*?id=\\&quot;(.*?)\\&quot;/g;
let match;
const idToValue = {};

while ((match = cellRegex.exec(content)) !== null) {
  let val = match[2]
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '').trim();
  if (val.length > 0 && val.length < 200 && !val.startsWith('data:image')) {
    idToValue[match[1]] = val;
  }
}

while ((match = cellRegex2.exec(content)) !== null) {
  let val = match[1]
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '').trim();
  if (val.length > 0 && val.length < 200 && !val.startsWith('data:image')) {
    idToValue[match[2]] = val;
  }
}

console.log('=== DIAGRAM ELEMENTS ===\n');
Object.entries(idToValue).forEach(([id, val]) => {
  console.log(`  [${id}] ${val}`);
});

// Extract ALL edges
console.log('\n=== CONNECTIONS ===\n');
const edgeRegex = /&lt;mxCell[^/]*?edge=\\&quot;1\\&quot;(.*?)\/&gt;/g;
const sourceTargetRegex = /source=\\&quot;(.*?)\\&quot;/;
const targetRegex = /target=\\&quot;(.*?)\\&quot;/;
const valueRegex = /value=\\&quot;(.*?)\\&quot;/;

// Simpler approach - find all source/target pairs
const allEdges = content.match(/edge=\\&quot;1\\&quot;[^/]*/g) || [];
allEdges.forEach((edge, i) => {
  const src = edge.match(/source=\\&quot;(.*?)\\&quot;/);
  const tgt = edge.match(/target=\\&quot;(.*?)\\&quot;/);
  const val = edge.match(/value=\\&quot;(.*?)\\&quot;/);

  const srcName = src ? (idToValue[src[1]] || src[1]) : '?';
  const tgtName = tgt ? (idToValue[tgt[1]] || tgt[1]) : '?';
  const label = val ? val[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]*>/g,'').trim() : '';

  console.log(`  ${srcName} --${label ? '(' + label + ')' : ''}--> ${tgtName}`);
});

// Get all pages/diagrams
const pages = content.match(/name=\\&quot;(.*?)\\&quot;/g) || [];
console.log('\n=== PAGES ===\n');
pages.forEach(p => {
  const name = p.match(/name=\\&quot;(.*?)\\&quot;/)[1];
  if (name && !name.startsWith('7_')) {
    console.log(`  - ${name}`);
  }
});
