const fs = require('fs');
const path = require('path');

const title = "PDF Voice: Read Aloud & Audio"; // 29 chars (Max 30)

// 76 chars (Max 80) - Front-loaded "Listen to PDFs aloud offline" + "natural text-to-speech" + "background audio"
const shortDescription = "Listen to PDFs aloud offline with natural text-to-speech & background audio.";

const fullDescription = `PDF Voice Reader turns any PDF, ebook, or document into an offline listening experience using high-quality on-device text-to-speech. Whether you are commuting, exercising, walking, or resting your eyes, this app reads your favorite books and study materials aloud with natural-sounding speech and background playback.

✦ TURN ANY PDF INTO AN AUDIOBOOK
Open textbooks, research papers, work manuals, lecture notes, or public-domain ebooks in seconds. PDF Voice Reader parses the text cleanly and begins reading sentence-by-sentence so you can listen while you multitask.

✦ SYNCHRONIZED WORD & SENTENCE TRACKING
Prefer to read and listen at the same time? Follow along with real-time visual sentence highlighting and word-level tracking. Tap any sentence on the page to immediately start reading aloud from that exact spot.

✦ CONTINUOUS BACKGROUND PLAYBACK
Keep listening even when your screen is turned off or while switching between other apps. With full lock-screen media controls and Android headset button support, you can pause, resume, and skip paragraphs without unlocking your phone.

✦ 100% OFFLINE & COMPLETE PRIVACY
Your documents, reading habits, and notes never leave your smartphone. The reader operates completely offline with zero cloud uploads, zero account registration, and zero trackers. Enjoy peaceful reading with complete privacy.

✦ CUSTOMIZE VOICES & READING SPEED
Choose from multiple natural speech voices installed on your Android device. Fine-tune your playback rate anywhere from 0.75x for complex technical papers up to 2.0x for speedy review.

✦ AUTOMATIC RESUME MEMORY
Never lose your place. The app automatically saves your exact reading position down to the page and sentence. Reopen your library days later and continue listening instantly with one tap.

✦ DUAL VIEW MODES
Switch seamlessly between Ebook Text Reflow mode for comfortable large-font reading and Original PDF Page mode to inspect diagrams, charts, and original page layouts.

✦ HOW IT WORKS IN 3 SIMPLE STEPS
1. Select a document: Import any PDF or text file from your device.
2. Tap Listen: Choose your preferred reading speed and voice.
3. Relax or multitask: Listen with your headphones in the background or follow along on screen.

✦ DESIGNED FOR FOCUSED READERS
• Students revising lecture notes and academic papers on the go
• Commuters and drivers turning long trips into productive reading time
• Avid book lovers transforming digital libraries into personalized audiobooks
• Anyone looking to reduce eye strain after hours in front of screens

Experience a calm, distraction-free way to absorb knowledge. With PDF Voice Reader, your entire personal library is always ready to read aloud offline.`;

console.log("=== STRICT METADATA VERIFICATION ===");
console.log(`Title (${title.length} chars / max 30): "${title}"`);
console.log(`Short Description (${shortDescription.length} chars / max 80): "${shortDescription}"`);
console.log(`Full Description Length: ${fullDescription.length} chars / max 4000`);

const totalWords = fullDescription.trim().split(/\s+/).length;
const kwMatches = fullDescription.match(/PDF Voice Reader/gi) || [];
const aloudMatches = fullDescription.match(/read aloud|reading aloud/gi) || [];
const offlineMatches = fullDescription.match(/offline/gi) || [];
const backgroundMatches = fullDescription.match(/background/gi) || [];

const density = ((kwMatches.length * 3 / totalWords) * 100).toFixed(2);
console.log(`Total Words: ${totalWords}`);
console.log(`"PDF Voice Reader" count: ${kwMatches.length} (${density}% density - Target: 2.0% - 3.0%)`);
console.log(`"read aloud" count: ${aloudMatches.length}`);
console.log(`"offline" count: ${offlineMatches.length}`);
console.log(`"background" count: ${backgroundMatches.length}`);

if (title.length <= 30 && shortDescription.length <= 80 && fullDescription.length <= 4000) {
  console.log("✅ ALL GOOGLE PLAY POLICY LIMITS PASSED!");
} else {
  console.error("❌ LIMIT VIOLATION DETECTED!");
}

const listingText = `# GOOGLE PLAY STORE LISTING METADATA

## App Title (Max 30 Chars)
${title}
(Length: ${title.length} / 30)

## Short Description (Max 80 Chars)
${shortDescription}
(Length: ${shortDescription.length} / 80)

## Full Description (Max 4,000 Chars)
${fullDescription}
(Length: ${fullDescription.length} / 4,000 | Word Count: ${totalWords} | Primary Keyword Density: ${density}%)
`;

fs.writeFileSync(path.resolve(__dirname, 'LISTING_METADATA.txt'), listingText, 'utf8');
