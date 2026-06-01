const fs = require('fs');
const readline = require('readline');
const path = '/Users/shubhamtripathi/.gemini/antigravity-ide/brain/5a8bb9e5-cb15-4a4c-82ba-236dd50be9c0/.system_generated/logs/transcript.jsonl';

async function restore() {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let bestMatch = null;
    let maxLines = 0;
    
    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.type === 'VIEW_FILE' || (entry.type === 'TOOL_RESPONSE' && entry.content && entry.content.includes('checkout.tsx'))) {
                const match = (entry.content || '').match(/The following code has been modified.*?\n([\s\S]*?)\nThe above content shows/);
                if (match && match[1]) {
                    const linesCount = match[1].split('\n').length;
                    if (linesCount > maxLines) {
                        maxLines = linesCount;
                        bestMatch = match[1];
                    }
                }
            }
        } catch (e) {}
    }

    if (bestMatch) {
        const lines = bestMatch.split('\n');
        const fileContent = lines.map(l => {
            const colonIdx = l.indexOf(':');
            if (colonIdx !== -1 && !isNaN(parseInt(l.substring(0, colonIdx)))) {
                return l.substring(colonIdx + 2); // remove "123: "
            }
            return l;
        });
        fs.writeFileSync('/Users/shubhamtripathi/Downloads/MHN-stagging/apps/mobile-app/app/(setup)/checkout.tsx', fileContent.join('\n'));
        console.log("Restored successfully. Lines:", fileContent.length);
    } else {
        console.log("Could not find the original content in transcript.");
    }
}
restore();
