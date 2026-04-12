import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

const targetStr = `  <div className="flex flex-col">
    <Hero onModeChange={onModeChange} />
    <Advantage />
    <EcosystemPillars />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />
    {isSubscribed && <TheSIL isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />}
    <TrustSignals />`;

const replaceStr = `  <div className="flex flex-col">
    <Hero onModeChange={onModeChange} />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />
    {isSubscribed && <TheSIL isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />}
    <Advantage />
    <EcosystemPillars />
    <TrustSignals />`;

app = app.replace(targetStr, replaceStr);
app = app.replace(targetStr.replace(/\n/g, '\r\n'), replaceStr.replace(/\n/g, '\r\n'));

writeFileSync('src/App.tsx', app, 'utf8');

console.log("Moved Sanctuaries towards the top!");
