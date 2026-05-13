import fs from 'fs';
import path from 'path';

const buildDir = 'build';

if (fs.existsSync(buildDir)) {
    // 1. Create .nojekyll
    fs.writeFileSync(path.join(buildDir, '.nojekyll'), '');
    console.log('✅ Created .nojekyll');

    // 2. Create 404.html from index.html (The GitHub Pages SPA Hack)
    const indexPah = path.join(buildDir, 'index.html');
    const fallbackPath = path.join(buildDir, '404.html');
    
    if (fs.existsSync(indexPah)) {
        fs.copyFileSync(indexPah, fallbackPath);
        console.log('✅ Created 404.html from index.html');
    } else {
        console.error('❌ Could not find index.html to create 404.html');
    }
} else {
    console.error('❌ Build directory not found!');
}
