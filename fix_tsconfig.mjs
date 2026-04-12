import { readFileSync, writeFileSync } from 'fs';

let tsconfig = readFileSync('tsconfig.json', 'utf8');

const targetStr = `    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}`;

const replaceStr = `    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "*.mjs", "**/*.mjs"]
}`;

// Fix line endings
tsconfig = tsconfig.replace(targetStr, replaceStr);
tsconfig = tsconfig.replace(targetStr.replace(/\n/g, '\r\n'), replaceStr.replace(/\n/g, '\r\n'));

writeFileSync('tsconfig.json', tsconfig, 'utf8');

console.log("tsconfig.json updated!");
