const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const RAW_DIR = path.resolve(__dirname, 'raw_screens');
const COMPOSITIONS_HTML_DIR = path.resolve(__dirname, 'html_compositions');
const OUT_DIR = path.resolve(__dirname, 'production_screenshots');

if (!fs.existsSync(COMPOSITIONS_HTML_DIR)) {
  fs.mkdirSync(COMPOSITIONS_HTML_DIR, { recursive: true });
}
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Convert raw image to base64 so HTML can load it locally without file protocol origin restrictions
function getBase64Image(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const frames = [
  {
    id: 1,
    name: '1_listen_aloud',
    badge: 'BACKGROUND AUDIO PLAYER',
    headline: 'Listen to Any PDF Aloud',
    subheadline: 'Turn books and documents into audiobooks with background playback',
    imageFile: '1_player.png',
    bgGradient: 'linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 50%, #F5F7FA 100%)',
    accentColor: '#4F46E5',
    pillBg: '#EEF2FF',
    pillText: '#4F46E5',
  },
  {
    id: 2,
    name: '2_word_highlighting',
    badge: 'DUAL MODE READER',
    headline: 'Follow Along Word-by-Word',
    subheadline: 'Synchronized voice tracking with real-time sentence highlighting',
    imageFile: '2_reader.png',
    bgGradient: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 50%, #FAF5FF 100%)',
    accentColor: '#7C3AED',
    pillBg: '#F3E8FF',
    pillText: '#7C3AED',
  },
  {
    id: 3,
    name: '3_voices_and_speed',
    badge: 'TOTAL PLAYBACK CONTROL',
    headline: 'Natural Voices & Speed',
    subheadline: 'Fine-tune 0.75x to 2.0x playback rate with on-device speech engines',
    imageFile: '4_settings.png',
    bgGradient: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 50%, #F0FDF4 100%)',
    accentColor: '#059669',
    pillBg: '#DCFCE7',
    pillText: '#059669',
  },
  {
    id: 4,
    name: '4_offline_privacy',
    badge: 'OFFLINE-FIRST & SECURE',
    headline: '100% Offline & Private',
    subheadline: 'Files never leave your phone · Automatically remembers where you left off',
    imageFile: '3_library.png',
    bgGradient: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 50%, #F0F7FF 100%)',
    accentColor: '#2563EB',
    pillBg: '#DBEAFE',
    pillText: '#2563EB',
  },
];

for (const frame of frames) {
  const base64Img = getBase64Image(frame.imageFile);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
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
      width: 1080px;
      height: 1920px;
      background: ${frame.bgGradient};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Ambient decorative lighting */
    .glow-circle {
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, ${frame.accentColor}1A 0%, transparent 70%);
      top: 100px;
      left: 140px;
      z-index: 1;
      filter: blur(40px);
    }

    /* Top text header section (first 25% of the frame) */
    .header-zone {
      position: relative;
      z-index: 10;
      width: 100%;
      padding: 96px 64px 32px 64px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: ${frame.pillBg};
      color: ${frame.pillText};
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 12px 28px;
      border-radius: 40px;
      margin-bottom: 24px;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .headline {
      font-size: 64px;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1.5px;
      margin-bottom: 16px;
      max-width: 950px;
    }

    .subheadline {
      font-size: 34px;
      font-weight: 500;
      color: #475569;
      line-height: 1.4;
      max-width: 880px;
    }

    /* Device Zone (Center-Bottom 75%) */
    .device-zone {
      position: relative;
      z-index: 10;
      width: 100%;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 24px;
    }

    /* Ultra-clean Android Chassis (Google Pixel 8/9 style) */
    .android-chassis {
      width: 820px;
      height: 1460px;
      background: #111827;
      border-radius: 64px;
      padding: 16px;
      position: relative;
      box-shadow:
        0 40px 100px -20px rgba(15, 23, 42, 0.35),
        0 20px 40px -15px rgba(15, 23, 42, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    }

    /* Outer metallic bezel shine */
    .android-chassis::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border-radius: 67px;
      background: linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.3) 100%);
      z-index: -1;
    }

    /* Camera punch-hole */
    .camera-hole {
      position: absolute;
      top: 32px;
      left: 50%;
      transform: translateX(-50%);
      width: 28px;
      height: 28px;
      background: #000000;
      border-radius: 50%;
      z-index: 30;
      box-shadow: 0 0 0 2px #1f2937;
    }

    /* Screen display container */
    .screen-display {
      width: 100%;
      height: 100%;
      border-radius: 50px;
      overflow: hidden;
      position: relative;
      background: #F7F7F5;
    }

    .screen-image {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="glow-circle"></div>

  <!-- Header Text Zone -->
  <div class="header-zone">
    <div class="badge">${frame.badge}</div>
    <h1 class="headline">${frame.headline}</h1>
    <p class="subheadline">${frame.subheadline}</p>
  </div>

  <!-- Device Zone -->
  <div class="device-zone">
    <div class="android-chassis">
      <div class="camera-hole"></div>
      <div class="screen-display">
        <img class="screen-image" src="${base64Img}" alt="${frame.headline}" />
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const htmlPath = path.join(COMPOSITIONS_HTML_DIR, `${frame.name}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Wrote composition ${htmlPath}`);

  const outPath = path.join(OUT_DIR, `${frame.name}.png`);
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${outPath}" --window-size=1080,1920 "file://${htmlPath}"`;
  console.log(`Rendering ${frame.name} at 1080x1920...`);
  execSync(cmd);
  console.log(`Rendered ${outPath}`);
}

console.log('All 4 production listing screenshots created successfully!');
