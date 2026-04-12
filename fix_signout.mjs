import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// Find the handleSignOut block and replace it
const old1 = `  const handleSignOut = async () => {
    await signOut(auth);
    setViewMode('home');
    setShowAdmin(false);
  };`;

const new1 = `  const handleSignOut = async () => {
    // Immediately clear local state so UI responds right away
    setAuthUser(null);
    setShowAdmin(false);
    setShowAdminPanel(false);
    setViewMode('home');
    // Then sign out from Firebase
    try {
      if (auth) await signOut(auth);
    } catch {/* silent */}
  };`;

// Try both LF and CRLF
if (app.includes(old1)) {
  app = app.replace(old1, new1);
  console.log("Replaced with LF");
} else {
  const old1crlf = old1.replace(/\n/g, '\r\n');
  const new1crlf = new1.replace(/\n/g, '\r\n');
  if (app.includes(old1crlf)) {
    app = app.replace(old1crlf, new1crlf);
    console.log("Replaced with CRLF");
  } else {
    // Fallback: find by line number and splice
    const lines = app.split('\n');
    // Line 4761 in 1-indexed => index 4760
    const idx = 4760;
    // Find the 5-line block
    const block = lines.slice(idx, idx + 5).join('\n');
    console.log("Block at line 4761:", JSON.stringify(block));
  }
}

writeFileSync('src/App.tsx', app, 'utf8');
