const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'apps/mobile-app/app');

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if it imports SafeAreaView from react-native
    if (content.includes('SafeAreaView') && content.match(/import\s+{([^}]*)}?\s+from\s+['"]react-native['"]/)) {
        
        // Remove SafeAreaView from react-native imports
        let newContent = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"]/g, (match, p1) => {
            if (!p1.includes('SafeAreaView')) return match;
            
            const imports = p1.split(',').map(s => s.trim()).filter(s => s !== 'SafeAreaView' && s !== '');
            if (imports.length === 0) return '';
            return `import { ${imports.join(', ')} } from 'react-native'`;
        });
        
        // If content was changed, we need to add the import from react-native-safe-area-context
        if (newContent !== content) {
            // Find the last import
            const importMatches = [...newContent.matchAll(/^import.*from.*;?$/gm)];
            if (importMatches.length > 0) {
                const lastImport = importMatches[importMatches.length - 1];
                const insertPos = lastImport.index + lastImport[0].length;
                newContent = newContent.slice(0, insertPos) + "\nimport { SafeAreaView } from 'react-native-safe-area-context';" + newContent.slice(insertPos);
            } else {
                newContent = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + newContent;
            }
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`Updated ${filePath}`);
        }
    }
}

processDirectory(appDir);
console.log('Done.');
