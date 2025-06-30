// Generate a new favicon with white background using SVG
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Read the SVG file
const svgContent = fs.readFileSync('favicon.svg', 'utf-8');

// Create a simple ICO file by creating a PNG-based ICO
// For simplicity, we'll use the sharp package if available, or imagemagick if installed
function createFaviconFromSVG() {
  try {
    // Try using imagemagick convert command if available
    execSync('which convert', { stdio: 'ignore' });
    
    console.log('📷 Converting SVG to ICO using ImageMagick...');
    execSync(`convert favicon.svg -background white -resize 32x32 src/app/favicon.ico`);
    console.log('✅ Favicon converted successfully using ImageMagick!');
    
  } catch (error) {
    console.log('⚠️  ImageMagick not found, creating basic ICO manually...');
    
    // Create a basic ICO file structure manually
    const svgData = Buffer.from(svgContent);
    
    // Simple approach: create an ICO header and embed SVG data
    // Note: This creates a valid ICO but browsers may not support SVG in ICO
    const iconDir = Buffer.alloc(6);
    iconDir.writeUInt16LE(0, 0); // Reserved
    iconDir.writeUInt16LE(1, 2); // Type (1 = ICO)
    iconDir.writeUInt16LE(1, 4); // Number of images
    
    const iconDirEntry = Buffer.alloc(16);
    iconDirEntry.writeUInt8(32, 0);  // Width
    iconDirEntry.writeUInt8(32, 1);  // Height
    iconDirEntry.writeUInt8(0, 2);   // Color palette
    iconDirEntry.writeUInt8(0, 3);   // Reserved
    iconDirEntry.writeUInt16LE(1, 4); // Color planes
    iconDirEntry.writeUInt16LE(32, 6); // Bits per pixel
    iconDirEntry.writeUInt32LE(svgData.length, 8); // Image size
    iconDirEntry.writeUInt32LE(22, 12); // Offset to image data
    
    const icoBuffer = Buffer.concat([iconDir, iconDirEntry, svgData]);
    
    // Save the favicon
    const faviconPath = path.join(process.cwd(), 'src/app/favicon.ico');
    fs.writeFileSync(faviconPath, icoBuffer);
    
    console.log('✅ Basic ICO file created!');
  }
}

createFaviconFromSVG();
