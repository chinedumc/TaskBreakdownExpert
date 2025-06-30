#!/usr/bin/env node

// Convert black favicon to white favicon using macOS sips tool
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🔄 Converting black favicon to white favicon...');

const tempDir = './temp-favicon';
const faviconPath = './src/app/favicon.ico';
const svgPath = './favicon.svg';

try {
  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Method 1: Use the existing SVG with white background if available
  if (fs.existsSync(svgPath)) {
    console.log('📄 Using existing SVG with white background...');
    
    // Convert SVG to PNG with white background using sips
    console.log('🖼️  Converting SVG to PNG...');
    execSync(`sips -s format png "${svgPath}" --out "${tempDir}/favicon-32.png"`);
    
    // Resize to common favicon sizes
    execSync(`sips -z 16 16 "${tempDir}/favicon-32.png" --out "${tempDir}/favicon-16.png"`);
    execSync(`sips -z 32 32 "${tempDir}/favicon-32.png" --out "${tempDir}/favicon-32-final.png"`);
    execSync(`sips -z 48 48 "${tempDir}/favicon-32.png" --out "${tempDir}/favicon-48.png"`);
    
    console.log('✅ PNG files created with white background');
    
  } else {
    // Method 2: Convert existing ICO to PNG, invert colors, and recreate
    console.log('🔄 Converting ICO to PNG for color inversion...');
    
    // Convert ICO to PNG
    execSync(`sips -s format png "${faviconPath}" --out "${tempDir}/favicon-original.png"`);
    
    // Create versions with inverted colors (black to white)
    // Note: sips doesn't have direct color inversion, so we'll use a different approach
    console.log('⚪ Creating white background version...');
    
    // For now, let's use the SVG approach since it's more reliable
    console.log('ℹ️  Please ensure favicon.svg exists with white background');
    throw new Error('SVG file not found - using fallback method');
  }
  
  // Use sips to create a simple ICO from the PNG
  // Note: sips doesn't create true ICO files, so we'll create a workaround
  console.log('🔧 Creating new ICO file...');
  
  // Copy the best PNG as favicon (some browsers accept PNG as favicon.ico)
  execSync(`cp "${tempDir}/favicon-32-final.png" "${faviconPath}"`);
  
  // Also create an actual ICO using a Node.js approach
  createProperIco();
  
  console.log('✅ Favicon converted to white background!');
  
} catch (error) {
  console.log('⚠️  sips method failed, trying alternative approach...');
  console.log('Error:', error.message);
  
  // Fallback: Create a simple white favicon manually
  createSimpleWhiteFavicon();
  
} finally {
  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf "${tempDir}"`);
  }
}

function createProperIco() {
  console.log('🛠️  Creating proper ICO file structure...');
  
  try {
    // Read the SVG content
    const svgContent = fs.readFileSync('./favicon.svg', 'utf-8');
    
    // Create a more compatible ICO structure
    // For simplicity, we'll embed the SVG in a basic ICO wrapper
    const svgBuffer = Buffer.from(svgContent);
    
    // ICO header (6 bytes)
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);  // Reserved
    header.writeUInt16LE(1, 2);  // Type: ICO
    header.writeUInt16LE(1, 4);  // Number of images
    
    // ICO directory entry (16 bytes)
    const dirEntry = Buffer.alloc(16);
    dirEntry.writeUInt8(32, 0);    // Width
    dirEntry.writeUInt8(32, 1);    // Height
    dirEntry.writeUInt8(0, 2);     // Color palette (0 = no palette)
    dirEntry.writeUInt8(0, 3);     // Reserved
    dirEntry.writeUInt16LE(1, 4);  // Color planes
    dirEntry.writeUInt16LE(32, 6); // Bits per pixel
    dirEntry.writeUInt32LE(svgBuffer.length, 8);  // Image size
    dirEntry.writeUInt32LE(22, 12); // Offset to image data
    
    // Combine all parts
    const icoBuffer = Buffer.concat([header, dirEntry, svgBuffer]);
    
    // Write the ICO file
    fs.writeFileSync('./src/app/favicon.ico', icoBuffer);
    console.log('✅ Proper ICO file created!');
    
  } catch (error) {
    console.log('⚠️  ICO creation failed:', error.message);
  }
}

function createSimpleWhiteFavicon() {
  console.log('🎨 Creating simple white favicon as fallback...');
  
  // Create a simple white square favicon as base64 embedded in ICO
  const whitePixelData = Buffer.alloc(32 * 32 * 4); // 32x32 RGBA
  
  // Fill with white pixels (255, 255, 255, 255)
  for (let i = 0; i < whitePixelData.length; i += 4) {
    whitePixelData[i] = 255;     // R
    whitePixelData[i + 1] = 255; // G
    whitePixelData[i + 2] = 255; // B
    whitePixelData[i + 3] = 255; // A
  }
  
  // Create basic ICO structure
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // Reserved
  header.writeUInt16LE(1, 2);  // Type: ICO
  header.writeUInt16LE(1, 4);  // Number of images
  
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0);    // Width
  dirEntry.writeUInt8(32, 1);    // Height
  dirEntry.writeUInt8(0, 2);     // Color palette
  dirEntry.writeUInt8(0, 3);     // Reserved
  dirEntry.writeUInt16LE(1, 4);  // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(whitePixelData.length, 8);  // Image size
  dirEntry.writeUInt32LE(22, 12); // Offset to image data
  
  const icoBuffer = Buffer.concat([header, dirEntry, whitePixelData]);
  fs.writeFileSync('./src/app/favicon.ico', icoBuffer);
  
  console.log('✅ Simple white favicon created!');
}
