const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/LandingPage.tsx',
  'src/pages/ProfilePage.tsx', 
  'src/pages/roleplay/SessionListPage.tsx'
];

filesToFix.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Grid container with Grid2 container
    content = content.replace(/Grid container/g, 'Grid2 container');
    content = content.replace(/<Grid xs=/g, '<Grid2 xs=');
    content = content.replace(/<Grid sm=/g, '<Grid2 sm=');
    content = content.replace(/<Grid md=/g, '<Grid2 md=');
    content = content.replace(/<Grid lg=/g, '<Grid2 lg=');
    content = content.replace(/<Grid xl=/g, '<Grid2 xl=');
    content = content.replace(/<Grid key=/g, '<Grid2 key=');
    content = content.replace(/<\/Grid>/g, '</Grid2>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } catch (err) {
    console.error(`Error fixing ${filePath}:`, err.message);
  }
});
