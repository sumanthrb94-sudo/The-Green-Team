import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// The replacement should happen multiple times
app = app.replace(/808 \? 5,097/g, '808 - 5,097');

writeFileSync('src/App.tsx', app, 'utf8');

console.log("Fixed broken characters in App.tsx");
