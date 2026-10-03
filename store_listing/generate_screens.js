const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(__dirname, 'raw_screens');
const HTML_DIR = path.resolve(__dirname, 'html_screens');

if (!fs.existsSync(HTML_DIR)) {
  fs.mkdirSync(HTML_DIR, { recursive: true });
}
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Common styles & status bar
const COMMON_HEAD = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=2400, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }
    body {
      width: 1080px;
      height: 2400px;
      background-color: #F7F7F5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #171717;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .status-bar {
      height: 108px;
      padding: 0 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 38px;
      font-weight: 600;
      color: #171717;
      letter-spacing: -0.5px;
    }
    .status-icons {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .status-icons svg {
      fill: #171717;
    }
    .nav-bar-gesture {
      height: 96px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
    }
    .gesture-pill {
      width: 320px;
      height: 12px;
      background: #171717;
      border-radius: 6px;
      opacity: 0.25;
    }
  </style>
`;

const STATUS_BAR_HTML = `
  <div class="status-bar">
    <span>09:41</span>
    <div class="status-icons">
      <!-- Signal -->
      <svg width="42" height="32" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 13c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
      <!-- Wifi -->
      <svg width="42" height="32" viewBox="0 0 24 24"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.55 0 6.78 1.41 9.17 3.7L12 19.38 2.83 11.2C5.22 8.91 8.45 7.5 12 7.5z"/></svg>
      <!-- Battery -->
      <svg width="48" height="32" viewBox="0 0 24 24"><path d="M16 4h-1V2h-6v2H8C6.9 4 6 4.9 6 6v14c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H8V6h8v14z"/></svg>
    </div>
  </div>
`;

const GESTURE_BAR_HTML = `
  <div class="nav-bar-gesture">
    <div class="gesture-pill"></div>
  </div>
`;

// ==========================================
// 1. FULLSCREEN LISTENING SCREEN
// ==========================================
const screen1ListeningHtml = `
${COMMON_HEAD}
  <style>
    .screen-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 48px;
    }
    .header {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .btn-back {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      font-size: 64px;
      color: #171717;
      cursor: pointer;
    }
    .header-title {
      font-size: 38px;
      font-weight: 600;
      color: #6B6B6B;
      letter-spacing: 0.5px;
    }
    .btn-stop {
      font-size: 36px;
      font-weight: 700;
      color: #EF4444;
      cursor: pointer;
    }
    .doc-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 40px;
      margin-bottom: 50px;
    }
    .doc-icon-badge {
      width: 180px;
      height: 220px;
      background: #EEF2FF;
      border: 3px solid #C7D2FE;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 36px rgba(79, 70, 229, 0.12);
      margin-bottom: 36px;
      position: relative;
    }
    .doc-icon-badge .fold {
      position: absolute;
      top: 0;
      right: 0;
      width: 48px;
      height: 48px;
      background: #C7D2FE;
      border-bottom-left-radius: 16px;
    }
    .doc-icon-text {
      font-size: 44px;
      font-weight: 800;
      color: #4F46E5;
      letter-spacing: 1px;
    }
    .doc-title {
      font-size: 52px;
      font-weight: 800;
      color: #171717;
      text-align: center;
      line-height: 1.25;
      max-width: 900px;
      margin-bottom: 16px;
    }
    .doc-subtitle {
      font-size: 38px;
      font-weight: 500;
      color: #6B6B6B;
    }
    .text-card {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 36px;
      padding: 56px 48px;
      margin-bottom: 50px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.04);
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .card-label {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 28px;
      font-weight: 700;
      padding: 10px 24px;
      border-radius: 30px;
      align-self: flex-start;
      margin-bottom: 32px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .text-quote {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 52px;
      line-height: 1.5;
      color: #1F2937;
    }
    .text-quote .highlight {
      background: #4F46E5;
      color: #FFFFFF;
      padding: 2px 10px;
      border-radius: 8px;
    }
    .controls-panel {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 44px;
      padding: 48px 40px;
      margin-bottom: 24px;
      box-shadow: 0 20px 48px rgba(0,0,0,0.06);
    }
    .progress-bar-container {
      width: 100%;
      height: 14px;
      background: #E5E7EB;
      border-radius: 7px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .progress-fill {
      width: 44%;
      height: 100%;
      background: #4F46E5;
      border-radius: 7px;
    }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: 34px;
      font-weight: 600;
      color: #6B6B6B;
      margin-bottom: 44px;
    }
    .main-buttons-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 60px;
      margin-bottom: 48px;
    }
    .btn-track {
      width: 130px;
      height: 130px;
      border-radius: 65px;
      background: #F7F7F5;
      border: 2px solid #E5E7EB;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .btn-track svg {
      width: 48px;
      height: 48px;
      fill: #171717;
    }
    .btn-track span {
      font-size: 24px;
      font-weight: 600;
      color: #6B6B6B;
      margin-top: 4px;
    }
    .btn-play-pause {
      width: 190px;
      height: 190px;
      border-radius: 95px;
      background: #4F46E5;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 40px rgba(79, 70, 229, 0.4);
      cursor: pointer;
    }
    .btn-play-pause svg {
      width: 72px;
      height: 72px;
      fill: #FFFFFF;
    }
    .speed-presets {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
    }
    .speed-pill {
      flex: 1;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background: #F7F7F5;
      border: 2px solid #E5E7EB;
      font-size: 32px;
      font-weight: 600;
      color: #6B6B6B;
    }
    .speed-pill.active {
      background: #EEF2FF;
      border-color: #4F46E5;
      color: #4F46E5;
      font-weight: 700;
    }
    .bg-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 30px;
      color: #10B981;
      font-weight: 600;
      margin-top: 24px;
    }
    .pulse-dot {
      width: 18px;
      height: 18px;
      background: #10B981;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  ${STATUS_BAR_HTML}
  <div class="screen-container">
    <div class="header">
      <div class="btn-back">‹</div>
      <div class="header-title">NOW LISTENING</div>
      <div class="btn-stop">Stop</div>
    </div>

    <div class="doc-info">
      <div class="doc-icon-badge">
        <div class="fold"></div>
        <div class="doc-icon-text">PDF</div>
      </div>
      <div class="doc-title">Atomic Habits — James Clear</div>
      <div class="doc-subtitle">Chapter 4 · The Man Who Didn't Look Right</div>
    </div>

    <div class="text-card">
      <div class="card-label">
        <div class="pulse-dot" style="background:#4F46E5"></div>
        Spoken Sentence
      </div>
      <div class="text-quote">
        "Every action you take is a vote for the type of person you wish to become. As the votes build up, so does the <span class="highlight">evidence</span> of your new identity."
      </div>
    </div>

    <div class="controls-panel">
      <div class="progress-bar-container">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-meta">
        <span>Page 42 of 320</span>
        <span>44% Completed</span>
      </div>

      <div class="main-buttons-row">
        <div class="btn-track">
          <!-- Prev track -->
          <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          <span>Prev</span>
        </div>
        <div class="btn-play-pause">
          <!-- Pause -->
          <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </div>
        <div class="btn-track">
          <!-- Next track -->
          <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          <span>Next</span>
        </div>
      </div>

      <div class="speed-presets">
        <div class="speed-pill">0.75x</div>
        <div class="speed-pill">1.0x</div>
        <div class="speed-pill active">1.25x</div>
        <div class="speed-pill">1.5x</div>
        <div class="speed-pill">2.0x</div>
      </div>

      <div class="bg-badge">
        <div class="pulse-dot"></div>
        Background Service Active · Lock-screen Controls Ready
      </div>
    </div>
  </div>
  ${GESTURE_BAR_HTML}
</body>
</html>
`;

// ==========================================
// 2. READER VIEW SCREEN (Dual Mode & Word Sync)
// ==========================================
const screen2ReaderHtml = `
${COMMON_HEAD}
  <style>
    .screen-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 48px;
    }
    .header {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .btn-back {
      font-size: 64px;
      color: #171717;
      cursor: pointer;
    }
    .header-center {
      text-align: center;
    }
    .doc-name {
      font-size: 40px;
      font-weight: 700;
      color: #171717;
      max-width: 620px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .page-indicator {
      font-size: 30px;
      color: #6B6B6B;
      font-weight: 500;
      margin-top: 4px;
    }
    .font-controls {
      display: flex;
      gap: 12px;
    }
    .btn-font {
      width: 76px;
      height: 76px;
      border-radius: 20px;
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      font-weight: 700;
      color: #171717;
    }
    .mode-bar {
      margin: 16px 0 32px 0;
      display: flex;
      justify-content: center;
    }
    .mode-segment {
      width: 100%;
      height: 94px;
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 26px;
      display: flex;
      padding: 8px;
      gap: 8px;
    }
    .mode-tab {
      flex: 1;
      height: 100%;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 600;
      color: #6B6B6B;
    }
    .mode-tab.active {
      background: #4F46E5;
      color: #FFFFFF;
      font-weight: 700;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
    }
    .reader-scroll {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding-bottom: 20px;
    }
    .chunk-card {
      padding: 36px 36px;
      border-radius: 28px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }
    .chunk-card.active {
      background: #EEF2FF;
      border-color: #4F46E5;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08);
    }
    .active-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .speaking-pill {
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      padding: 8px 22px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }
    .sentence-index {
      font-size: 28px;
      font-weight: 600;
      color: #4F46E5;
    }
    .reading-text {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 46px;
      line-height: 1.65;
      color: #1F2937;
    }
    .word-highlight {
      background: #4F46E5;
      color: #FFFFFF;
      padding: 2px 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .inactive-chunk {
      opacity: 0.78;
    }
    .floating-audio-bar {
      background: #181A1F;
      border-radius: 40px;
      padding: 28px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
      margin-bottom: 20px;
    }
    .fab-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .fab-play {
      width: 100px;
      height: 100px;
      border-radius: 50px;
      background: #4F46E5;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 24px rgba(79, 70, 229, 0.4);
    }
    .fab-play svg {
      width: 44px;
      height: 44px;
      fill: #FFFFFF;
    }
    .fab-info {
      display: flex;
      flex-direction: column;
    }
    .fab-status {
      font-size: 32px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .fab-speed {
      font-size: 26px;
      color: #9CA3AF;
      margin-top: 4px;
    }
    .fab-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .fab-btn {
      width: 80px;
      height: 80px;
      border-radius: 40px;
      background: #2D3139;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fab-btn svg {
      width: 36px;
      height: 36px;
      fill: #FFFFFF;
    }
  </style>
</head>
<body>
  ${STATUS_BAR_HTML}
  <div class="screen-container">
    <div class="header">
      <div class="btn-back">‹</div>
      <div class="header-center">
        <div class="doc-name">Deep Work — Cal Newport.pdf</div>
        <div class="page-indicator">Page 18 of 296</div>
      </div>
      <div class="font-controls">
        <div class="btn-font">A-</div>
        <div class="btn-font">A+</div>
      </div>
    </div>

    <!-- ReadEra Mode Switcher -->
    <div class="mode-bar">
      <div class="mode-segment">
        <div class="mode-tab active">📖 Ebook Text</div>
        <div class="mode-tab">📄 PDF Page</div>
      </div>
    </div>

    <!-- Text Flow with Active Sentence & Word Highlight -->
    <div class="reader-scroll">
      <div class="chunk-card inactive-chunk">
        <div class="reading-text">
          Deep work is the ability to focus without distraction on a cognitively demanding task. It is a superpower in our increasingly competitive twenty-first-century economy.
        </div>
      </div>

      <div class="chunk-card active">
        <div class="active-header">
          <div class="speaking-pill">● NOW READING</div>
          <div class="sentence-index">Sentence 2 of 14</div>
        </div>
        <div class="reading-text">
          To produce at your peak level you need to work for extended periods with full <span class="word-highlight">concentration</span> on a single task free from all distraction.
        </div>
      </div>

      <div class="chunk-card inactive-chunk">
        <div class="reading-text">
          The reason most knowledge workers struggle with deep work is not that they lack willpower, but rather that our modern workplace culture actively incentivizes fragmentation and quick responsiveness.
        </div>
      </div>

      <div class="chunk-card inactive-chunk">
        <div class="reading-text">
          If you cultivate this skill, you will thrive and produce creative breakthroughs that shallow multitaskers cannot match.
        </div>
      </div>
    </div>

    <!-- Floating ReadEra Audio Controller -->
    <div class="floating-audio-bar">
      <div class="fab-left">
        <div class="fab-play">
          <!-- Pause -->
          <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </div>
        <div class="fab-info">
          <div class="fab-status">Reading aloud...</div>
          <div class="fab-speed">Speed: 1.25x · Natural US Voice</div>
        </div>
      </div>
      <div class="fab-actions">
        <div class="fab-btn">
          <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </div>
        <div class="fab-btn">
          <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </div>
        <div class="fab-btn" style="background:#4F46E5">
          <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        </div>
      </div>
    </div>
  </div>
  ${GESTURE_BAR_HTML}
</body>
</html>
`;

// ==========================================
// 3. LIBRARY SCREEN (Home with Recents)
// ==========================================
const screen3LibraryHtml = `
${COMMON_HEAD}
  <style>
    .screen-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 48px;
    }
    .header {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 58px;
      font-weight: 800;
      color: #171717;
      letter-spacing: -0.5px;
    }
    .btn-settings {
      width: 96px;
      height: 96px;
      border-radius: 48px;
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 44px;
      color: #4B5563;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .section-label {
      font-size: 30px;
      font-weight: 700;
      color: #6B6B6B;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 24px;
    }
    .featured-card {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 36px;
      padding: 44px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.04);
      margin-bottom: 48px;
    }
    .featured-top {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
    }
    .book-cover {
      width: 140px;
      height: 190px;
      background: linear-gradient(135deg, #4F46E5, #3730A3);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 24px rgba(79, 70, 229, 0.25);
      color: #FFFFFF;
      font-weight: 800;
      font-size: 32px;
      letter-spacing: 1px;
    }
    .book-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .book-title {
      font-size: 44px;
      font-weight: 800;
      color: #171717;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .book-author {
      font-size: 34px;
      color: #6B6B6B;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .book-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 26px;
      font-weight: 700;
      color: #4F46E5;
      background: #EEF2FF;
      padding: 6px 18px;
      border-radius: 14px;
      align-self: flex-start;
    }
    .featured-progress-bar {
      width: 100%;
      height: 12px;
      background: #E5E7EB;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .featured-progress-fill {
      width: 44%;
      height: 100%;
      background: #4F46E5;
      border-radius: 6px;
    }
    .featured-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    .progress-text {
      font-size: 32px;
      font-weight: 600;
      color: #6B6B6B;
    }
    .btn-resume {
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 32px;
      font-weight: 700;
      padding: 18px 36px;
      border-radius: 22px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
    }
    .btn-resume svg {
      width: 28px;
      height: 28px;
      fill: #FFFFFF;
    }
    .recents-grid {
      display: flex;
      gap: 28px;
      margin-bottom: 48px;
    }
    .recent-item {
      flex: 1;
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 30px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 20px rgba(0,0,0,0.03);
    }
    .recent-cover {
      width: 100%;
      height: 160px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 30px;
      color: #FFFFFF;
      margin-bottom: 24px;
    }
    .recent-title {
      font-size: 34px;
      font-weight: 700;
      color: #171717;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .recent-meta {
      font-size: 28px;
      color: #6B6B6B;
    }
    .btn-add-pdf {
      width: 100%;
      height: 120px;
      border: 3px dashed #CBD5E1;
      background: #FFFFFF;
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      font-size: 38px;
      font-weight: 700;
      color: #4F46E5;
      margin-bottom: 36px;
      cursor: pointer;
    }
    .privacy-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 30px;
      color: #6B6B6B;
      font-weight: 500;
    }
  </style>
</head>
<body>
  ${STATUS_BAR_HTML}
  <div class="screen-container">
    <div class="header">
      <div class="brand-title">PDF Voice</div>
      <div class="btn-settings">⚙</div>
    </div>

    <!-- Continue Listening -->
    <div class="section-label">CONTINUE LISTENING</div>
    <div class="featured-card">
      <div class="featured-top">
        <div class="book-cover">
          <div>HABITS</div>
        </div>
        <div class="book-meta">
          <div class="book-title">Atomic Habits</div>
          <div class="book-author">James Clear · 320 pages</div>
          <div class="book-badge">⚡ Resumes at Sentence 42</div>
        </div>
      </div>
      <div class="featured-progress-bar">
        <div class="featured-progress-fill"></div>
      </div>
      <div class="featured-footer">
        <div class="progress-text">Page 42 of 320 (44%)</div>
        <div class="btn-resume">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Listen Now
        </div>
      </div>
    </div>

    <!-- Recent Documents -->
    <div class="section-label">RECENT DOCUMENTS</div>
    <div class="recents-grid">
      <div class="recent-item">
        <div class="recent-cover" style="background: linear-gradient(135deg, #059669, #047857);">
          <div>FOCUS</div>
        </div>
        <div class="recent-title">Deep Work</div>
        <div class="recent-meta">Cal Newport · 18%</div>
      </div>
      <div class="recent-item">
        <div class="recent-cover" style="background: linear-gradient(135deg, #D97706, #B45309);">
          <div>HISTORY</div>
        </div>
        <div class="recent-title">Sapiens</div>
        <div class="recent-meta">Yuval Harari · 65%</div>
      </div>
    </div>

    <!-- Add PDF CTA -->
    <div class="btn-add-pdf">
      <span style="font-size: 52px; font-weight: 400; line-height: 0;">+</span>
      <span>Add PDF or Document</span>
    </div>

    <div class="privacy-notice">
      <span>🔒 100% On-Device · Your documents never leave this phone</span>
    </div>
  </div>
  ${GESTURE_BAR_HTML}
</body>
</html>
`;

// ==========================================
// 4. SETTINGS & VOICE CUSTOMIZATION
// ==========================================
const screen4SettingsHtml = `
${COMMON_HEAD}
  <style>
    .screen-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 48px;
    }
    .header {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .btn-back {
      font-size: 64px;
      color: #171717;
      cursor: pointer;
    }
    .header-title {
      font-size: 44px;
      font-weight: 800;
      color: #171717;
    }
    .section-label {
      font-size: 30px;
      font-weight: 700;
      color: #6B6B6B;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 28px 0 16px 0;
    }
    .card {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 32px;
      padding: 12px 36px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.03);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 36px 0;
    }
    .row-title {
      font-size: 38px;
      font-weight: 600;
      color: #171717;
    }
    .row-value {
      font-size: 36px;
      font-weight: 600;
      color: #4F46E5;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chevron {
      font-size: 40px;
      color: #9CA3AF;
    }
    .divider {
      height: 2px;
      background: #E5E7EB;
      width: 100%;
    }
    .speed-header {
      padding-top: 32px;
      font-size: 38px;
      font-weight: 600;
      color: #171717;
      margin-bottom: 24px;
    }
    .speed-scroll {
      display: flex;
      gap: 16px;
      padding-bottom: 32px;
    }
    .speed-btn {
      flex: 1;
      height: 88px;
      border-radius: 22px;
      background: #F7F7F5;
      border: 2px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 600;
      color: #6B6B6B;
    }
    .speed-btn.active {
      background: #4F46E5;
      border-color: #4F46E5;
      color: #FFFFFF;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
    }
    .guarantee-box {
      background: #EEF2FF;
      border: 2px solid #C7D2FE;
      border-radius: 32px;
      padding: 40px;
      margin-top: 40px;
    }
    .guarantee-title {
      font-size: 36px;
      font-weight: 800;
      color: #3730A3;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .guarantee-desc {
      font-size: 32px;
      color: #4338CA;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${STATUS_BAR_HTML}
  <div class="screen-container">
    <div class="header">
      <div class="btn-back">‹</div>
      <div class="header-title">Settings</div>
      <div style="width:64px;"></div>
    </div>

    <!-- Speech Settings -->
    <div class="section-label">SPEECH & TTS</div>
    <div class="card">
      <div class="row">
        <div class="row-title">Active Voice</div>
        <div class="row-value">
          <span>English (US) · Natural High-Q</span>
          <span class="chevron">›</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="speed-header">Default Reading Speed</div>
      <div class="speed-scroll">
        <div class="speed-btn">0.75x</div>
        <div class="speed-btn">1.0x</div>
        <div class="speed-btn active">1.25x</div>
        <div class="speed-btn">1.5x</div>
        <div class="speed-btn">2.0x</div>
      </div>
    </div>

    <!-- Appearance -->
    <div class="section-label">APPEARANCE</div>
    <div class="card">
      <div class="row">
        <div class="row-title">Theme</div>
        <div class="row-value" style="color: #6B6B6B;">
          <span>System Automatic</span>
        </div>
      </div>
    </div>

    <!-- Privacy & Offline Guarantee -->
    <div class="section-label">PRIVACY & STORAGE</div>
    <div class="card">
      <div class="row">
        <div class="row-title">Data Storage</div>
        <div class="row-value" style="color: #10B981;">
          <span>100% On-Device</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="row">
        <div class="row-title">Cloud Sync</div>
        <div class="row-value" style="color: #6B6B6B;">
          <span>Disabled (Zero Uploads)</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="row">
        <div class="row-title">Advertising & Trackers</div>
        <div class="row-value" style="color: #10B981;">
          <span>None (Zero Tracking)</span>
        </div>
      </div>
    </div>

    <div class="guarantee-box">
      <div class="guarantee-title">
        <span>🛡️ Offline-First Reading</span>
      </div>
      <div class="guarantee-desc">
        PDF Voice runs native on-device speech engines and local rendering. Your sensitive documents, books, and study material never leave your smartphone.
      </div>
    </div>
  </div>
  ${GESTURE_BAR_HTML}
</body>
</html>
`;

// ==========================================
// 5. ONBOARDING / WELCOME WALKTHROUGH
// ==========================================
const screen5WelcomeHtml = `
${COMMON_HEAD}
  <style>
    .screen-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 48px;
    }
    .top-bar {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-pill {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 28px;
      font-weight: 800;
      padding: 10px 24px;
      border-radius: 20px;
      letter-spacing: 1px;
    }
    .skip-btn {
      font-size: 34px;
      font-weight: 600;
      color: #6B6B6B;
    }
    .hero-title {
      font-size: 64px;
      font-weight: 800;
      color: #171717;
      line-height: 1.2;
      margin: 24px 0 16px 0;
    }
    .hero-sub {
      font-size: 36px;
      color: #6B6B6B;
      line-height: 1.5;
      margin-bottom: 40px;
    }
    .steps-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
      margin-bottom: 48px;
    }
    .step-card {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 32px;
      padding: 36px;
      display: flex;
      gap: 28px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.03);
    }
    .step-number {
      font-size: 40px;
      font-weight: 800;
      color: #4F46E5;
      background: #EEF2FF;
      width: 90px;
      height: 90px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-title {
      font-size: 38px;
      font-weight: 700;
      color: #171717;
      margin-bottom: 8px;
    }
    .step-desc {
      font-size: 32px;
      color: #6B6B6B;
      line-height: 1.45;
    }
    .btn-start {
      width: 100%;
      height: 120px;
      background: #4F46E5;
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow: 0 16px 36px rgba(79, 70, 229, 0.35);
      cursor: pointer;
    }
  </style>
</head>
<body>
  ${STATUS_BAR_HTML}
  <div class="screen-container">
    <div class="top-bar">
      <div class="brand-pill">PDF VOICE</div>
      <div class="skip-btn">Skip</div>
    </div>

    <div class="hero-title">Read with your ears.</div>
    <div class="hero-sub">
      Convert your documents into an offline listening experience. Private, calm, and designed for distraction-free reading.
    </div>

    <div class="steps-container">
      <div class="step-card">
        <div class="step-number">01</div>
        <div class="step-content">
          <div class="step-title">Select Any PDF</div>
          <div class="step-desc">Add ebooks, research papers, or work reports. 100% on-device with zero uploads.</div>
        </div>
      </div>
      <div class="step-card">
        <div class="step-number">02</div>
        <div class="step-content">
          <div class="step-title">Natural Voice Playback</div>
          <div class="step-desc">Sentence-by-sentence reading with real-time visual word tracking.</div>
        </div>
      </div>
      <div class="step-card">
        <div class="step-number">03</div>
        <div class="step-content">
          <div class="step-title">Background Audio</div>
          <div class="step-desc">Lock your phone or switch apps. Reading continues seamlessly in your headphones.</div>
        </div>
      </div>
    </div>

    <div class="btn-start">
      Get Started
    </div>
  </div>
  ${GESTURE_BAR_HTML}
</body>
</html>
`;

// Write HTML files
const screens = [
  { name: '1_player', html: screen1ListeningHtml },
  { name: '2_reader', html: screen2ReaderHtml },
  { name: '3_library', html: screen3LibraryHtml },
  { name: '4_settings', html: screen4SettingsHtml },
  { name: '5_welcome', html: screen5WelcomeHtml },
];

for (const s of screens) {
  const htmlPath = path.join(HTML_DIR, `${s.name}.html`);
  fs.writeFileSync(htmlPath, s.html, 'utf8');
  console.log(`Wrote ${htmlPath}`);

  const pngPath = path.join(OUT_DIR, `${s.name}.png`);
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${pngPath}" --window-size=1080,2400 "file://${htmlPath}"`;
  console.log(`Capturing ${s.name} screenshot...`);
  execSync(cmd);
  console.log(`Captured ${pngPath}`);
}

console.log('All 5 screens captured successfully!');
