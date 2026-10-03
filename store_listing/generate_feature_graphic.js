const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const RAW_DIR = path.resolve(__dirname, 'raw_screens');
const GRAPHICS_DIR = path.resolve(__dirname, 'graphics');

function getBase64Image(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const playerBase64 = getBase64Image('1_player.png');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1024, height=500, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      width: 1024px;
      height: 500px;
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4338CA 70%, #4F46E5 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 64px;
    }

    /* Ambient decorative waves / aura */
    .bg-circle-1 {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.25) 0%, transparent 70%);
      top: -100px;
      left: 100px;
      filter: blur(50px);
    }
    .bg-circle-2 {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
      bottom: -150px;
      right: 150px;
      filter: blur(60px);
    }

    /* Left Content Zone (Safe zone compliant) */
    .left-zone {
      position: relative;
      z-index: 10;
      max-width: 540px;
      display: flex;
      flex-direction: column;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #A5B4FC;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 8px 18px;
      border-radius: 20px;
      margin-bottom: 20px;
      align-self: flex-start;
      text-transform: uppercase;
    }

    .app-title {
      font-size: 52px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -1px;
      line-height: 1.1;
      margin-bottom: 14px;
    }

    .tagline {
      font-size: 24px;
      font-weight: 600;
      color: #C7D2FE;
      line-height: 1.35;
      margin-bottom: 24px;
    }

    .badges-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .feature-tag {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Right Device Mockup Zone */
    .right-zone {
      position: relative;
      z-index: 10;
      width: 380px;
      height: 500px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Floating angled phone */
    .phone-container {
      width: 280px;
      height: 560px;
      background: #111827;
      border-radius: 40px;
      padding: 8px;
      box-shadow:
        0 30px 60px -12px rgba(0, 0, 0, 0.6),
        0 18px 36px -18px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
      transform: perspective(1000px) rotateY(-12deg) rotateX(6deg) translateY(20px);
      position: relative;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      overflow: hidden;
      background: #F7F7F5;
    }

    .phone-screen img {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="bg-circle-1"></div>
  <div class="bg-circle-2"></div>

  <!-- Left Content (Safe Zone) -->
  <div class="left-zone">
    <div class="brand-pill">
      <span>●</span> OFFLINE AUDIO READER
    </div>
    <h1 class="app-title">PDF Voice Reader</h1>
    <p class="tagline">Listen to any document aloud with natural voice text-to-speech.</p>
    <div class="badges-row">
      <div class="feature-tag">🎧 Background Audio</div>
      <div class="feature-tag">📖 Word Sync</div>
      <div class="feature-tag">🔒 100% On-Device</div>
    </div>
  </div>

  <!-- Right Device Mockup -->
  <div class="right-zone">
    <div class="phone-container">
      <div class="phone-screen">
        <img src="${playerBase64}" alt="Player screen" />
      </div>
    </div>
  </div>
</body>
</html>
`;

const htmlPath = path.join(GRAPHICS_DIR, 'feature_graphic.html');
fs.writeFileSync(htmlPath, html, 'utf8');

const outPath = path.join(GRAPHICS_DIR, 'feature_graphic_1024x500.png');
const cmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${outPath}" --window-size=1024,500 "file://${htmlPath}"`;
console.log('Rendering Feature Graphic (1024x500)...');
execSync(cmd);
console.log(`Rendered feature graphic to ${outPath}`);
