const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(__dirname, 'production_screenshots');
const ASSETS_STORE_DIR = path.resolve(__dirname, '..', 'assets', 'store-listing');
const GRAPHICS_DIR = path.resolve(__dirname, 'graphics');
const HTML_DIR = path.resolve(__dirname, 'html_reference_style');

[OUT_DIR, ASSETS_STORE_DIR, GRAPHICS_DIR, HTML_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// App icon base64
const iconPath = path.resolve(__dirname, '..', 'assets', 'icon.png');
const iconBase64 = fs.existsSync(iconPath) 
  ? `data:image/png;base64,${fs.readFileSync(iconPath).toString('base64')}`
  : '';

// Common design tokens for our brand palette (matching reference listing layout, but using Royal Indigo / Violet)
const BRAND_BG = 'linear-gradient(180deg, #4338CA 0%, #3730A3 55%, #312E81 100%)';
const BRAND_ACCENT = '#4F46E5';
const BRAND_LIGHT = '#6366F1';

// Definition of 6 screenshots
const screenshots = [
  {
    id: 1,
    filename: '1_listen_aloud.png',
    headlineTop: "Can't Read a PDF?",
    headlineBottom: "Just Listen",
    hasHeadphoneIcon: true,
    renderContent: () => `
      <!-- Phone Screen Inside Chassis -->
      <div class="app-screen">
        <!-- App Header -->
        <div class="screen-header">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">The Art of Mindful Reading.pdf</div>
          <div class="header-action-badge">Audio ▾</div>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="mode-tabs">
          <div class="tab-btn active">📖 Ebook Text</div>
          <div class="tab-btn">📄 PDF Page</div>
        </div>

        <!-- Document Text Flow -->
        <div class="text-flow">
          <div class="chapter-label">CHAPTER 3: SOVEREIGN PRIVACY</div>
          <p class="reading-body">
            Your reading library is an intimate mirror of your intellect, curiosities, and personal growth. In the modern cloud landscape, too many applications extract your private annotations.
          </p>
          <p class="reading-body highlighted">
            <span class="sentence-highlight">Experience the profound peace of mind that comes from true offline autonomy. Here, your books belong entirely to you.</span>
          </p>
          <p class="reading-body">
            Every document opened within this application remains strictly confined to your physical device. No telemetry monitors your progress.
          </p>
        </div>

        <!-- Bottom Floating Controller Card (Reference Style) -->
        <div class="floating-player-card">
          <div class="player-card-header">
            <div class="player-doc-name">The Art of Mindful Reading.pdf</div>
            <div class="player-page-counter">Pages 3/4</div>
          </div>

          <div class="player-controls-row">
            <div class="ctrl-btn prev-btn">⏮</div>
            <div class="ctrl-btn seek-btn">↶ 10s</div>
            <div class="play-btn-circle">▶</div>
            <div class="ctrl-btn seek-btn">↷ 10s</div>
            <div class="ctrl-btn next-btn">⏭</div>
          </div>

          <div class="player-sub-row">
            <div class="voice-waveform-pill">
              <div class="pill-play-icon">▶</div>
              <span class="pill-voice-name">Narrator 1 (English)</span>
              <div class="waveform-bars">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div class="speed-pill">1X Playback Speed</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 2,
    filename: '2_pdf_scrubber.png',
    headlineTop: "View & Listen",
    headlineBottom: "Full PDF Page Scrub",
    hasHeadphoneIcon: false,
    renderContent: () => `
      <div class="app-screen">
        <div class="screen-header">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">The Art of Mindful Reading</div>
          <div class="zoom-btns"><span>A-</span><span>A+</span></div>
        </div>

        <div class="mode-tabs">
          <div class="tab-btn">📖 Ebook Text</div>
          <div class="tab-btn active">📄 PDF Page</div>
        </div>

        <!-- Top Scrollable Page Scrubber Chips -->
        <div class="page-scrubber-bar">
          <div class="page-chip">P. 1</div>
          <div class="page-chip">P. 2</div>
          <div class="page-chip">P. 3</div>
          <div class="page-chip active">P. 4 <span class="headphone-badge">🎧</span></div>
          <div class="page-chip">P. 5</div>
        </div>

        <!-- PDF Document Rendering View -->
        <div class="pdf-document-canvas">
          <div class="pdf-page-simulated">
            <div class="pdf-h1">Chapter 4: The Path Forward</div>
            <div class="pdf-line-lead">As technology continues to accelerate, the timeless craft of deep reading must be preserved.</div>
            <div class="pdf-para">Whether you are consuming historical treatises, scientific journals, or classic fiction, allow your ears to shoulder the burden of decoding text.</div>
            <div class="pdf-para">Experiment with different reading speeds to find your sweet spot. Some dense philosophy demands a deliberate pace, while brisk narrative fiction effortlessly glides at one-point-five.</div>
            <div class="pdf-para">Turn the page, immerse yourself in the cadence of speech, and rediscover the timeless joy of listening.</div>
          </div>
        </div>

        <!-- Floating Active Reading Card & Controls -->
        <div class="floating-reading-card">
          <div class="reading-pill-row">
            <div class="reading-status-pill">
              <span class="pulsing-dot"></span>
              READING NOW
            </div>
            <div class="reading-page-tag">Page 4 of 5</div>
          </div>
          <div class="reading-quote-text">
            "Chapter 4: The Path Forward. As technology continues to accelerate, the timeless craft of deep reading must be preserved..."
          </div>
          <div class="pdf-bottom-controls">
            <div class="listen-btn-large">
              <span>❚❚</span> Pause Audio
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 3,
    filename: '3_pick_narrator.png',
    headlineTop: "Pick Your Narrator",
    headlineBottom: "Filter by Language",
    hasHeadphoneIcon: false,
    renderContent: () => `
      <div class="app-screen">
        <div class="screen-header">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">Document Narrator Setup</div>
          <div class="close-x-btn">✕</div>
        </div>

        <div class="narrator-intro-box">
          <div class="narrator-intro-badge">✨ AUTO-DETECTED DOCUMENT LANGUAGE</div>
          <div class="narrator-intro-title">Choose Voice for This Book</div>
          <div class="narrator-intro-sub">Filtered to match document language with live audio previews.</div>
        </div>

        <!-- Language Filter Scrollable Chips -->
        <div class="language-filter-row">
          <div class="lang-chip">All</div>
          <div class="lang-chip active">🇬🇧 English (12)</div>
          <div class="lang-chip">🇮🇳 Hindi (6)</div>
          <div class="lang-chip">🇪🇸 Spanish (8)</div>
          <div class="lang-chip">🇩🇪 German (5)</div>
          <div class="lang-chip">🇫🇷 French (7)</div>
        </div>

        <!-- Voice Selection List with Audition Previews -->
        <div class="voice-cards-list">
          <div class="voice-card active">
            <div class="voice-radio active">✓</div>
            <div class="voice-card-info">
              <div class="voice-name-row">
                <span class="voice-name">en-in-x-end-network</span>
                <span class="voice-quality-tag">Neural Natural</span>
              </div>
              <div class="voice-locale">English (India) · High Clarity</div>
            </div>
            <div class="preview-btn active">
              <span>❚❚</span> Stop
            </div>
          </div>

          <div class="voice-card">
            <div class="voice-radio"></div>
            <div class="voice-card-info">
              <div class="voice-name-row">
                <span class="voice-name">en-us-x-sfg-local</span>
                <span class="voice-quality-tag offline">100% Offline</span>
              </div>
              <div class="voice-locale">English (United States) · Studio Male</div>
            </div>
            <div class="preview-btn">
              <span>▶</span> Preview
            </div>
          </div>

          <div class="voice-card">
            <div class="voice-radio"></div>
            <div class="voice-card-info">
              <div class="voice-name-row">
                <span class="voice-name">en-gb-x-rjs-local</span>
                <span class="voice-quality-tag offline">100% Offline</span>
              </div>
              <div class="voice-locale">English (United Kingdom) · Narrative</div>
            </div>
            <div class="preview-btn">
              <span>▶</span> Preview
            </div>
          </div>

          <div class="voice-card">
            <div class="voice-radio"></div>
            <div class="voice-card-info">
              <div class="voice-name-row">
                <span class="voice-name">en-au-x-aub-network</span>
                <span class="voice-quality-tag">Expressive</span>
              </div>
              <div class="voice-locale">English (Australia) · Warm Female</div>
            </div>
            <div class="preview-btn">
              <span>▶</span> Preview
            </div>
          </div>
        </div>

        <!-- Confirm Voice Button -->
        <div class="modal-bottom-action">
          <div class="confirm-voice-btn">Set Narrator for Document</div>
        </div>
      </div>
    `
  },
  {
    id: 4,
    filename: '4_tap_any_word.png',
    headlineTop: "Tap Any Word",
    headlineBottom: "Listen Instantly",
    hasHeadphoneIcon: false,
    renderContent: () => `
      <div class="app-screen">
        <div class="screen-header">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">The Art of Mindful Reading</div>
          <div class="voice-switcher-pill">🎙️ Voice</div>
        </div>

        <div class="mode-tabs">
          <div class="tab-btn active">📖 Ebook Text</div>
          <div class="tab-btn">📄 PDF Page</div>
        </div>

        <!-- Reader Text with Word-Level Interactive Touch Highlight -->
        <div class="text-flow">
          <div class="chapter-label">CHAPTER 3: SOVEREIGN PRIVACY</div>
          <p class="reading-body">
            Your reading library is an intimate mirror of your intellect, curiosities, and personal growth. In the modern cloud landscape, too many applications extract your private annotations.
          </p>
          <p class="reading-body interactive-demo">
            True intellectual freedom requires local 
            <span class="tapped-word-token">
              sovereignty
              <span class="tap-pointer-badge">
                <span class="tap-finger-icon">👆</span>
                <span class="tap-text">Tapped! Reads from here</span>
              </span>
            </span>. 
            Every document opened within this application remains strictly confined to your physical device. No network transmission takes place behind closed curtains.
          </p>
          <p class="reading-body">
            No telemetry monitors your progress. No external cloud server reconstructs your pages. No unauthorized algorithms peer over your shoulder as you turn the page.
          </p>
        </div>

        <!-- In-Reader Playback Floating Panel -->
        <div class="in-reader-audio-dock">
          <div class="dock-sentence-status">
            <span class="dock-badge">WORD SYNC</span>
            <span class="dock-sentence-num">Sentence 4 of 12 · Page 3 of 4</span>
          </div>

          <div class="dock-controls-row">
            <div class="dock-btn">⏮</div>
            <div class="dock-btn-play">❚❚</div>
            <div class="dock-btn">⏭</div>
            <div class="dock-btn-speed">1.25x</div>
            <div class="dock-btn-stop">⏹</div>
          </div>
          <div class="dock-hint-text">Tap any word or paragraph to start reading immediately</div>
        </div>
      </div>
    `
  },
  {
    id: 5,
    filename: '5_speed_and_privacy.png',
    headlineTop: "Listen 2× Faster",
    headlineBottom: "100% Offline & Private",
    hasHeadphoneIcon: false,
    renderContent: () => `
      <div class="app-screen">
        <div class="screen-header">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">Settings & Playback</div>
          <div class="header-blank"></div>
        </div>

        <div class="settings-content-flow">
          <!-- Speed Section Card -->
          <div class="settings-card">
            <div class="card-section-title">READING SPEED PRESETS</div>
            <div class="speed-presets-grid">
              <div class="speed-chip">0.75x</div>
              <div class="speed-chip">1.0x</div>
              <div class="speed-chip">1.25x</div>
              <div class="speed-chip">1.5x</div>
              <div class="speed-chip active">2.0x <span class="fast-badge">⚡ Turbo</span></div>
            </div>
            <div class="speed-sample-btn">🔊 Test Speed Sample</div>
          </div>

          <!-- Supported Document Formats Card -->
          <div class="settings-card">
            <div class="card-section-title">SUPPORTED FILE TYPES</div>
            <div class="formats-list">
              <div class="format-item">
                <div class="format-badge pdf">PDF</div>
                <div class="format-details">
                  <div class="format-name">PDF Documents (.pdf)</div>
                  <div class="format-desc">Books, research papers, study notes</div>
                </div>
                <div class="ready-check">✓ Ready</div>
              </div>
              <div class="format-item">
                <div class="format-badge epub">EPUB</div>
                <div class="format-details">
                  <div class="format-name">EPUB Ebooks (.epub)</div>
                  <div class="format-desc">Reflowable digital books & publications</div>
                </div>
                <div class="ready-check">✓ Ready</div>
              </div>
              <div class="format-item">
                <div class="format-badge txt">TXT</div>
                <div class="format-details">
                  <div class="format-name">Plain Text & Markdown (.txt, .md)</div>
                  <div class="format-desc">Transcripts, code notes, articles</div>
                </div>
                <div class="ready-check">✓ Ready</div>
              </div>
            </div>
          </div>

          <!-- 100% On-Device Offline Guarantee Card -->
          <div class="privacy-guarantee-card">
            <div class="privacy-shield-icon">🛡️</div>
            <div class="privacy-card-title">100% On-Device Privacy</div>
            <div class="privacy-card-desc">Zero cloud uploads · No server tracking · Text stays on your phone</div>
            <div class="privacy-badge-pill">🔒 SECURE LOCAL STORAGE</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 6,
    filename: '6_background_playback.png',
    headlineTop: "Hear in Background",
    headlineBottom: "Multitask with Ease",
    hasHeadphoneIcon: true,
    renderContent: () => `
      <div class="app-screen">
        <!-- Background Dimmed Reader -->
        <div class="screen-header dimmed">
          <div class="back-btn">‹</div>
          <div class="doc-header-title">The Art of Mindful Reading</div>
          <div class="zoom-btns"><span>A-</span><span>A+</span></div>
        </div>

        <div class="text-flow dimmed">
          <div class="chapter-label">CHAPTER 4: THE PATH FORWARD</div>
          <p class="reading-body">
            As technology continues to accelerate, the timeless craft of deep reading must be preserved. Whether you are commuting, exercising, or relaxing, listen without screen fatigue.
          </p>
        </div>

        <!-- Dark Scrim Backdrop for Modal -->
        <div class="modal-scrim"></div>

        <!-- Background Playback Exit Modal (Exact Real App Dialog) -->
        <div class="exit-modal-dialog">
          <div class="modal-headphone-circle">
            🎧
          </div>
          <div class="modal-title">Audio is Playing</div>
          <div class="modal-subtitle">
            Would you like to keep listening to "The Art of Mindful Reading" in the background, or stop playback?
          </div>

          <div class="modal-btn-hear">
            <span>🎧</span> Hear in Background
          </div>

          <div class="modal-btn-stop">
            <span>⏹</span> Stop Playing
          </div>

          <div class="modal-btn-cancel">
            Cancel
          </div>
        </div>

        <!-- Simulated Android Lockscreen Mini Notification Media Player -->
        <div class="media-notification-card">
          <div class="notif-top-row">
            <div class="notif-app-info">
              <span class="notif-icon">🎧</span>
              <span class="notif-app-name">PDF Voice · Audio Service</span>
            </div>
            <div class="notif-time">Now</div>
          </div>
          <div class="notif-body-row">
            <div class="notif-cover-art">PDF</div>
            <div class="notif-track-details">
              <div class="notif-track-title">The Art of Mindful Reading</div>
              <div class="notif-track-sub">Page 4 of 4 · Continuous Speech</div>
            </div>
            <div class="notif-controls">
              <span>⏮</span>
              <span class="notif-play">❚❚</span>
              <span>⏭</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// HTML template generator for 1080x1920 Google Play listing screenshots
function generateScreenshotHtml(item) {
  return `
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
      user-select: none;
    }
    body {
      width: 1080px;
      height: 1920px;
      background: ${BRAND_BG};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Ambient radial glow aura matching brand colorway */
    .ambient-glow {
      position: absolute;
      width: 900px;
      height: 900px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
      top: 50px;
      left: 90px;
      filter: blur(60px);
      z-index: 1;
    }

    /* Top Headline Zone (Matching reference app: bold, centered 2-line white typography) */
    .top-headline-zone {
      position: relative;
      z-index: 10;
      width: 100%;
      padding-top: 80px;
      padding-bottom: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .headline-line-1 {
      font-size: 74px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.15;
      letter-spacing: -1.2px;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      position: relative;
    }

    .headline-line-2 {
      font-size: 74px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.15;
      letter-spacing: -1.2px;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    /* Decorative headphone icon on top-left (reference app style) */
    .deco-headphone-icon {
      position: absolute;
      top: 72px;
      left: 64px;
      width: 80px;
      height: 80px;
      opacity: 0.95;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.25));
    }

    /* Phone Chassis Zone */
    .phone-chassis-zone {
      position: relative;
      z-index: 10;
      width: 100%;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-top: 15px;
    }

    .android-phone {
      width: 880px;
      height: 1560px;
      background: #0F172A;
      border-radius: 64px;
      padding: 16px;
      position: relative;
      box-shadow:
        0 45px 120px -15px rgba(15, 23, 42, 0.5),
        0 20px 40px -10px rgba(0, 0, 0, 0.35),
        0 0 0 2px rgba(255, 255, 255, 0.15) inset;
    }

    .android-phone::before {
      content: '';
      position: absolute;
      top: -3px; left: -3px; right: -3px; bottom: -3px;
      border-radius: 67px;
      background: linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.4) 100%);
      z-index: -1;
    }

    .camera-punchhole {
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 26px;
      height: 26px;
      background: #000000;
      border-radius: 50%;
      z-index: 50;
      box-shadow: 0 0 0 2px #1E293B;
    }

    .screen-viewport {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      border-radius: 50px;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* App Internal UI Styling */
    .app-screen {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 55px 36px 36px 36px;
      position: relative;
      color: #0F172A;
    }

    .screen-header {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .screen-header.dimmed { opacity: 0.35; filter: blur(2px); }

    .back-btn {
      font-size: 52px;
      font-weight: 300;
      color: #1E293B;
      cursor: pointer;
      line-height: 1;
    }

    .doc-header-title {
      font-size: 28px;
      font-weight: 700;
      color: #0F172A;
      max-width: 520px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-action-badge {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 20px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 20px;
      border: 1px solid #C7D2FE;
    }

    .zoom-btns {
      display: flex;
      gap: 12px;
    }
    .zoom-btns span {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      font-size: 20px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 12px;
      color: #334155;
    }

    .voice-switcher-pill {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 22px;
      font-weight: 700;
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid #C7D2FE;
    }

    .close-x-btn {
      font-size: 28px;
      font-weight: 700;
      color: #64748B;
    }

    /* Mode Tabs */
    .mode-tabs {
      display: flex;
      background: #E2E8F0;
      border-radius: 16px;
      padding: 4px;
      margin-bottom: 24px;
      align-self: center;
      width: 420px;
    }

    .tab-btn {
      flex: 1;
      text-align: center;
      padding: 12px 0;
      font-size: 22px;
      font-weight: 600;
      color: #64748B;
      border-radius: 12px;
    }

    .tab-btn.active {
      background: #4F46E5;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    /* Text Flow */
    .text-flow {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .text-flow.dimmed { opacity: 0.35; filter: blur(2px); }

    .chapter-label {
      font-size: 20px;
      font-weight: 800;
      color: #6366F1;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .reading-body {
      font-size: 27px;
      line-height: 1.6;
      color: #334155;
      font-family: Georgia, serif;
    }

    .reading-body.highlighted {
      background: #EEF2FF;
      border-left: 5px solid #4F46E5;
      padding: 14px 18px;
      border-radius: 8px;
    }

    .sentence-highlight {
      color: #1E1B4B;
      font-weight: 600;
    }

    /* Floating Player Card (Reference Style) */
    .floating-player-card {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #FFFFFF;
      border-radius: 36px;
      padding: 28px 24px;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .player-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 14px;
    }

    .player-doc-name {
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
      max-width: 500px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-page-counter {
      font-size: 20px;
      font-weight: 700;
      color: #64748B;
    }

    .player-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 6px 0;
    }

    .ctrl-btn {
      width: 60px;
      height: 60px;
      background: #F1F5F9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #334155;
      font-weight: 700;
    }

    .ctrl-btn.seek-btn {
      width: 90px;
      font-size: 20px;
      background: #EEF2FF;
      color: #4F46E5;
      border: 1px solid #C7D2FE;
    }

    .play-btn-circle {
      width: 92px;
      height: 92px;
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 38px;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
    }

    .player-sub-row {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .voice-waveform-pill {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pill-play-icon {
      width: 28px;
      height: 28px;
      background: #0F172A;
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .pill-voice-name {
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .waveform-bars {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 22px;
    }
    .waveform-bars span {
      width: 4px;
      background: #4F46E5;
      border-radius: 2px;
    }
    .waveform-bars span:nth-child(1) { height: 8px; }
    .waveform-bars span:nth-child(2) { height: 16px; }
    .waveform-bars span:nth-child(3) { height: 22px; }
    .waveform-bars span:nth-child(4) { height: 14px; }
    .waveform-bars span:nth-child(5) { height: 19px; }
    .waveform-bars span:nth-child(6) { height: 10px; }
    .waveform-bars span:nth-child(7) { height: 17px; }
    .waveform-bars span:nth-child(8) { height: 9px; }

    .speed-pill {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 12px 18px;
      font-size: 19px;
      font-weight: 800;
      color: #0F172A;
      white-space: nowrap;
    }

    /* Screen 2: PDF Page Scrubber Specifics */
    .page-scrubber-bar {
      display: flex;
      gap: 12px;
      overflow: hidden;
      padding-bottom: 16px;
      border-bottom: 1px solid #E2E8F0;
      margin-bottom: 16px;
    }

    .page-chip {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      color: #475569;
      font-size: 20px;
      font-weight: 700;
      padding: 10px 22px;
      border-radius: 16px;
      white-space: nowrap;
    }

    .page-chip.active {
      background: #4F46E5;
      border-color: #4F46E5;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pdf-document-canvas {
      flex: 1;
      background: #FFFFFF;
      border-radius: 24px;
      border: 1px solid #E2E8F0;
      padding: 30px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }

    .pdf-page-simulated {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pdf-h1 {
      font-size: 30px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }

    .pdf-line-lead {
      font-size: 22px;
      font-weight: 600;
      color: #334155;
      line-height: 1.5;
    }

    .pdf-para {
      font-size: 20px;
      line-height: 1.6;
      color: #64748B;
      font-family: Georgia, serif;
    }

    .floating-reading-card {
      position: absolute;
      bottom: 24px;
      left: 20px;
      right: 20px;
      background: #FFFFFF;
      border-radius: 32px;
      padding: 24px 26px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
      border: 2px solid #C7D2FE;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .reading-pill-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reading-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 18px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    .pulsing-dot {
      width: 10px;
      height: 10px;
      background: #4F46E5;
      border-radius: 50%;
    }

    .reading-page-tag {
      font-size: 19px;
      font-weight: 700;
      color: #64748B;
    }

    .reading-quote-text {
      font-size: 21px;
      line-height: 1.5;
      color: #1E293B;
      font-weight: 600;
      font-style: italic;
    }

    .pdf-bottom-controls {
      display: flex;
      justify-content: center;
      margin-top: 6px;
    }

    .listen-btn-large {
      width: 100%;
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      padding: 16px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    /* Screen 3: Narrator & Language Filter */
    .narrator-intro-box {
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      border-radius: 24px;
      padding: 20px 24px;
      margin-bottom: 20px;
    }

    .narrator-intro-badge {
      font-size: 16px;
      font-weight: 800;
      color: #4338CA;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .narrator-intro-title {
      font-size: 26px;
      font-weight: 800;
      color: #1E1B4B;
      margin-bottom: 4px;
    }

    .narrator-intro-sub {
      font-size: 19px;
      color: #475569;
    }

    .language-filter-row {
      display: flex;
      gap: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .lang-chip {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      color: #334155;
      font-size: 20px;
      font-weight: 700;
      padding: 12px 20px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .lang-chip.active {
      background: #4F46E5;
      border-color: #4F46E5;
      color: #FFFFFF;
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
    }

    .voice-cards-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .voice-card {
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-radius: 24px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .voice-card.active {
      border-color: #4F46E5;
      background: #FAF5FF;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12);
    }

    .voice-radio {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2.5px solid #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .voice-radio.active {
      border-color: #4F46E5;
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
    }

    .voice-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .voice-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .voice-name {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
    }

    .voice-quality-tag {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 15px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 12px;
    }
    .voice-quality-tag.offline {
      background: #DCFCE7;
      color: #15803D;
    }

    .voice-locale {
      font-size: 18px;
      color: #64748B;
    }

    .preview-btn {
      background: #FFFFFF;
      border: 2px solid #4F46E5;
      color: #4F46E5;
      font-size: 19px;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .preview-btn.active {
      background: #4F46E5;
      color: #FFFFFF;
    }

    .modal-bottom-action {
      margin-top: 16px;
    }

    .confirm-voice-btn {
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      padding: 18px;
      border-radius: 24px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
    }

    /* Screen 4: Tap Any Word Interactive Feature */
    .reading-body.interactive-demo {
      position: relative;
      line-height: 2.2;
    }

    .tapped-word-token {
      position: relative;
      display: inline-flex;
      align-items: center;
      background: #4F46E5;
      color: #FFFFFF;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(79, 70, 229, 0.4);
      vertical-align: middle;
      margin: 0 4px;
    }

    .tap-pointer-badge {
      position: absolute;
      bottom: calc(100% + 14px);
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.25);
      z-index: 30;
    }
    .tap-pointer-badge::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #0F172A;
    }

    .in-reader-audio-dock {
      background: #FFFFFF;
      border-radius: 32px;
      padding: 24px 28px;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
      border: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .dock-sentence-status {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dock-badge {
      background: #DCFCE7;
      color: #15803D;
      font-size: 16px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 12px;
    }

    .dock-sentence-num {
      font-size: 19px;
      font-weight: 600;
      color: #64748B;
    }

    .dock-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
    }

    .dock-btn {
      font-size: 30px;
      color: #334155;
    }

    .dock-btn-play {
      width: 76px;
      height: 76px;
      background: #4F46E5;
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    }

    .dock-btn-speed {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 20px;
      font-weight: 800;
      padding: 10px 18px;
      border-radius: 16px;
      border: 1px solid #C7D2FE;
    }

    .dock-btn-stop {
      font-size: 30px;
      color: #EF4444;
    }

    .dock-hint-text {
      text-align: center;
      font-size: 17px;
      color: #64748B;
      font-weight: 500;
    }

    /* Screen 5: Speed Presets & Supported Formats */
    .settings-content-flow {
      display: flex;
      flex-direction: column;
      gap: 18px;
      flex: 1;
    }

    .settings-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.03);
    }

    .card-section-title {
      font-size: 17px;
      font-weight: 800;
      color: #64748B;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .speed-presets-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .speed-chip {
      flex: 1;
      text-align: center;
      padding: 14px 0;
      background: #F8FAFC;
      border: 1.5px solid #CBD5E1;
      border-radius: 16px;
      font-size: 22px;
      font-weight: 700;
      color: #334155;
    }

    .speed-chip.active {
      background: #4F46E5;
      border-color: #4F46E5;
      color: #FFFFFF;
      box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
      position: relative;
    }

    .fast-badge {
      display: block;
      font-size: 13px;
      font-weight: 800;
      color: #FDE047;
      margin-top: 2px;
    }

    .speed-sample-btn {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 20px;
      font-weight: 800;
      padding: 14px;
      border-radius: 16px;
      text-align: center;
      border: 1.5px solid #C7D2FE;
    }

    .formats-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .format-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #F1F5F9;
    }
    .format-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .format-badge {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
    }
    .format-badge.pdf { background: #EEF2FF; color: #4F46E5; }
    .format-badge.epub { background: #F3E8FF; color: #7C3AED; }
    .format-badge.txt { background: #F0FDF4; color: #16A34A; }

    .format-details {
      flex: 1;
    }
    .format-name {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 3px;
    }
    .format-desc {
      font-size: 17px;
      color: #64748B;
    }

    .ready-check {
      font-size: 18px;
      font-weight: 800;
      color: #10B981;
    }

    .privacy-guarantee-card {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
      color: #FFFFFF;
      border-radius: 28px;
      padding: 26px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      box-shadow: 0 12px 36px rgba(30, 27, 75, 0.35);
    }

    .privacy-shield-icon {
      font-size: 42px;
      margin-bottom: 4px;
    }

    .privacy-card-title {
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
    }

    .privacy-card-desc {
      font-size: 18px;
      color: #CBD5E1;
      max-width: 520px;
      line-height: 1.4;
    }

    .privacy-badge-pill {
      background: rgba(255, 255, 255, 0.15);
      color: #A5B4FC;
      font-size: 15px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 20px;
      margin-top: 8px;
      letter-spacing: 1px;
    }

    /* Screen 6: Background Playback Modal */
    .modal-scrim {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      z-index: 10;
    }

    .exit-modal-dialog {
      position: absolute;
      top: 180px;
      left: 36px;
      right: 36px;
      background: #FFFFFF;
      border-radius: 40px;
      padding: 44px 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 20;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
    }

    .modal-headphone-circle {
      width: 100px;
      height: 100px;
      background: #EEF2FF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 52px;
      margin-bottom: 24px;
    }

    .modal-title {
      font-size: 38px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 16px;
    }

    .modal-subtitle {
      font-size: 23px;
      line-height: 1.5;
      color: #475569;
      margin-bottom: 32px;
      max-width: 580px;
    }

    .modal-btn-hear {
      width: 100%;
      background: #4F46E5;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      padding: 20px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
    }

    .modal-btn-stop {
      width: 100%;
      background: #FFFFFF;
      border: 2px solid #EF4444;
      color: #EF4444;
      font-size: 24px;
      font-weight: 800;
      padding: 18px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .modal-btn-cancel {
      font-size: 22px;
      font-weight: 600;
      color: #64748B;
      cursor: pointer;
    }

    .media-notification-card {
      position: absolute;
      bottom: 28px;
      left: 20px;
      right: 20px;
      background: #1E293B;
      border-radius: 32px;
      padding: 22px 24px;
      color: #FFFFFF;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      z-index: 25;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notif-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notif-app-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: #94A3B8;
      font-weight: 600;
    }

    .notif-time {
      font-size: 16px;
      color: #64748B;
    }

    .notif-body-row {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .notif-cover-art {
      width: 72px;
      height: 72px;
      background: #4F46E5;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      color: #FFFFFF;
    }

    .notif-track-details {
      flex: 1;
    }
    .notif-track-title {
      font-size: 23px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 4px;
    }
    .notif-track-sub {
      font-size: 17px;
      color: #94A3B8;
    }

    .notif-controls {
      display: flex;
      align-items: center;
      gap: 18px;
      font-size: 26px;
      color: #FFFFFF;
    }
    .notif-play {
      width: 52px;
      height: 52px;
      background: #FFFFFF;
      color: #0F172A;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>

  <!-- Decorative Headphone Icon on Top-Left (Reference App Style) -->
  ${item.hasHeadphoneIcon ? `
    <svg class="deco-headphone-icon" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
  ` : ''}

  <!-- Top 2-Line Bold Headline -->
  <div class="top-headline-zone">
    <div class="headline-line-1">${item.headlineTop}</div>
    <div class="headline-line-2">${item.headlineBottom}</div>
  </div>

  <!-- Android Device Frame Zone -->
  <div class="phone-chassis-zone">
    <div class="android-phone">
      <div class="camera-punchhole"></div>
      <div class="screen-viewport">
        ${item.renderContent()}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Feature Graphic HTML Generator (1024 x 500 px, Zero-Cropped Safe-Zone Guarantee)
function generateFeatureGraphicHtml() {
  return `
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
      user-select: none;
    }
    body {
      width: 1024px;
      height: 500px;
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 35%, #4338CA 70%, #4F46E5 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 72px; /* Inset compliant with 800x400 safe zone */
    }

    /* Ambient radiant halos */
    .halo-left {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.25) 0%, transparent 70%);
      top: -120px;
      left: 60px;
      filter: blur(50px);
    }
    .halo-right {
      position: absolute;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, transparent 70%);
      bottom: -100px;
      right: 80px;
      filter: blur(55px);
    }

    /* Left Branding Zone (Safe Zone Compliant) */
    .left-branding-zone {
      position: relative;
      z-index: 10;
      max-width: 530px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .brand-top-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .master-icon {
      width: 82px;
      height: 82px;
      border-radius: 20px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #A5B4FC;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.2px;
      padding: 6px 16px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .pill-green-dot {
      width: 7px;
      height: 7px;
      background: #10B981;
      border-radius: 50%;
    }

    .main-app-title {
      font-size: 52px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -1.2px;
      line-height: 1.08;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
    }

    .hero-tagline {
      font-size: 21px;
      font-weight: 500;
      color: #C7D2FE;
      line-height: 1.35;
      max-width: 490px;
    }

    .feature-pills-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
      max-width: 480px;
    }

    .feat-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 700;
      padding: 9px 14px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Right Device Zone: Complete un-cropped smartphone chassis (Mandatory 100% visible) */
    .right-device-zone {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .complete-chassis {
      width: 220px;
      height: 388px; /* Comfortably within 400px vertical safe zone leaving >56px margin top and bottom */
      background: #0F172A;
      border-radius: 36px;
      padding: 8px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
      position: relative;
    }

    .phone-punchhole {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background: #000;
      border-radius: 50%;
      z-index: 20;
    }

    .chassis-screen {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 24px 14px 12px 14px;
      gap: 8px;
    }

    .mini-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
    }

    .mini-tabs {
      display: flex;
      background: #E2E8F0;
      border-radius: 8px;
      padding: 2px;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
    }
    .mini-tab-active {
      flex: 1;
      background: #4F46E5;
      color: #FFF;
      border-radius: 6px;
      padding: 3px 0;
    }
    .mini-tab-inactive {
      flex: 1;
      color: #64748B;
      padding: 3px 0;
    }

    .mini-text-area {
      flex: 1;
      font-size: 8px;
      line-height: 1.4;
      color: #475569;
      font-family: Georgia, serif;
      background: #FFFFFF;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
    }

    .mini-highlight-text {
      background: #EEF2FF;
      color: #4338CA;
      font-weight: 700;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .mini-floating-dock {
      background: #FFFFFF;
      border-radius: 14px;
      padding: 8px 10px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mini-play-btn {
      width: 28px;
      height: 28px;
      background: #4F46E5;
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .mini-speed-badge {
      font-size: 9px;
      font-weight: 800;
      color: #4F46E5;
      background: #EEF2FF;
      padding: 3px 6px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="halo-left"></div>
  <div class="halo-right"></div>

  <!-- Left Content Zone -->
  <div class="left-branding-zone">
    <div class="brand-top-row">
      <img class="master-icon" src="${iconBase64}" alt="PDF Voice Reader Icon" />
      <div class="eyebrow-pill">
        <span class="pill-green-dot"></span>
        100% OFFLINE TTS
      </div>
    </div>

    <h1 class="main-app-title">PDF Voice Reader</h1>
    <p class="hero-tagline">Turn Any PDF into Natural Spoken Audio</p>

    <div class="feature-pills-grid">
      <div class="feat-pill">⚡ Instant Voice</div>
      <div class="feat-pill">🌍 Multilingual Filter</div>
      <div class="feat-pill">🔒 100% On-Device</div>
      <div class="feat-pill">🎧 Background Play</div>
    </div>
  </div>

  <!-- Right Device Zone: Complete Un-Cropped Phone -->
  <div class="right-device-zone">
    <div class="complete-chassis">
      <div class="phone-punchhole"></div>
      <div class="chassis-screen">
        <div class="mini-top-bar">
          <span>‹ Mindful Reading</span>
          <span>Pages 3/4</span>
        </div>

        <div class="mini-tabs">
          <div class="mini-tab-active">📖 Ebook</div>
          <div class="mini-tab-inactive">📄 PDF</div>
        </div>

        <div class="mini-text-area">
          <span class="mini-highlight-text">Experience the profound peace of mind that comes from true offline autonomy.</span>
          Here, your books belong entirely to you. No data ever leaves this phone.
        </div>

        <div class="mini-floating-dock">
          <div style="font-size: 8px; font-weight: 700; color: #1E293B;">Narrator 1 · EN</div>
          <div class="mini-play-btn">▶</div>
          <div class="mini-speed-badge">1.25x</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Render screenshots
console.log('--- Generating 6 Google Play Listing Screenshots (1080x1920) ---');
for (const sc of screenshots) {
  const html = generateScreenshotHtml(sc);
  const htmlPath = path.join(HTML_DIR, `${sc.id}_${sc.filename.replace('.png', '.html')}`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const outProd = path.join(OUT_DIR, sc.filename);
  const outAssets = path.join(ASSETS_STORE_DIR, `screenshot_${sc.id}.png`);

  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${outProd}" --window-size=1080,1920 "file://${htmlPath}"`;
  console.log(`Rendering Screenshot ${sc.id}: ${sc.filename}...`);
  execSync(cmd);

  fs.copyFileSync(outProd, outAssets);
  console.log(`✓ Saved to ${outProd} & ${outAssets}`);
}

// Render Feature Graphic
console.log('\n--- Generating Feature Graphic (1024x500) ---');
const fgHtml = generateFeatureGraphicHtml();
const fgHtmlPath = path.join(HTML_DIR, 'feature_graphic.html');
fs.writeFileSync(fgHtmlPath, fgHtml, 'utf8');

const fgProd = path.join(GRAPHICS_DIR, 'feature_graphic_1024x500.png');
const fgAssets = path.join(ASSETS_STORE_DIR, 'feature_graphic.png');

const fgCmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${fgProd}" --window-size=1024,500 "file://${fgHtmlPath}"`;
console.log('Rendering Feature Graphic 1024x500...');
execSync(fgCmd);

fs.copyFileSync(fgProd, fgAssets);
console.log(`✓ Saved Feature Graphic to ${fgProd} & ${fgAssets}`);

console.log('\nAll Google Play Store assets successfully generated!');
