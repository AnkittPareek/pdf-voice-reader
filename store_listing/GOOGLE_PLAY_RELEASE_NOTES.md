# Google Play Console Submission Notes & Release Details
**App Name:** PDF Voice: Read Aloud & Audio  
**Package Name:** `com.pdfvoice.app`  
**Version:** 1.0.1 (`versionCode 2`)  

---

## 1. What's New in this Release (Release Notes)
> **Google Play Console limit:** 500 characters max per language  
> **Copy & paste this into the "Release notes" box when creating the production release:**

### English (en-US)
```text
Welcome to the initial release of PDF Voice Reader!

• Listen to any PDF, textbook, or document offline with natural voice speech.
• Synchronized sentence highlighting and tap-to-read navigation.
• Seamless background playback with lock screen media controls.
• Adjustable reading speeds (0.75x – 2.0x) and voice selection.
• Automatic resume memory—picks up right where you stopped.
• 100% private and offline: your documents never leave your device.
```
*(Character count: ~460 / 500)*

---

## 2. App Access & Reviewer Instructions
> **Location in Console:** App Content > App Access  
> **Selection:** "All functionality is available without special access or credentials"

**Notes for Google Reviewers:**
```text
PDF Voice Reader is a 100% offline document reader that does not require any user account, login credentials, or backend server access.

To test the application:
1. Launch the app.
2. Tap "Select PDF" to choose any document from device storage (or tap the built-in sample document).
3. The app extracts text on-device and starts sentence-by-sentence audio playback using Android's native Text-to-Speech engine.
4. Press the phone's Power button or switch apps to verify background media playback via the foreground service notification.
```

---

## 3. Foreground Service Declaration (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`)
> **Location in Console:** App Content > Foreground Service Permissions  
> **Required on Android 14+ (API 34+)**

* **Permission Requested:** `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK`
* **Core Feature Justification:**
```text
PDF Voice Reader is an audiobook and document listening application. The core user-facing functionality is converting written documents into audio speech.

Users initiate audio reading and routinely lock their device screen or navigate to other applications (e.g., during transit, commutes, or workouts). The FOREGROUND_SERVICE_MEDIA_PLAYBACK permission is strictly required to keep the Text-to-Speech audio playing continuously without interruption when backgrounded, accompanied by standard Android lock-screen playback controls (play, pause, skip sentence).
```

---

## 4. Data Safety Form Responses
> **Location in Console:** App Content > Data Safety

| Question | Value | Details |
| :--- | :--- | :--- |
| **Does your app collect or share user data?** | **No** (for document content) | PDF documents and user reading positions are stored strictly locally in on-device SQLite. |
| **Is data encrypted in transit?** | **Yes** | Standard HTTPS used by Google Mobile Ads SDK. |
| **Can users request data deletion?** | **Not applicable** | No accounts or cloud storage exist; deleting the app removes all local data. |
| **Third-Party SDKs:** | **Google Mobile Ads (AdMob)** | Standard advertising ID and diagnostic analytics collected per Google Play policy for AdMob. |

---

## 5. Advertising ID Declaration (`AD_ID`)
> **Location in Console:** Policy > App Content > Advertising ID  
> **Selection:** Select **"Yes, my app uses advertising ID"**  
> **Purposes to check:**
> - [x] **Advertising or marketing** (used by Google Mobile Ads SDK to serve ads)
> - [x] **Analytics** (ad performance analytics)

---

## 6. Deobfuscation / ProGuard Mapping File
> **Automatic:** The App Bundle already has `proguard.map` embedded inside `BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`. Google Play Console automatically detects and uses it upon upload.  
> **Manual Upload (if needed):**  
> Location: `Release > App bundle explorer > Downloads > Deobfuscation file`  
> File path: `android/app/build/outputs/mapping/release/mapping.txt`

---

## 7. Store Listing Quick Reference

* **App Title (29 / 30 chars):**  
  `PDF Voice: Read Aloud & Audio`
* **Short Description (76 / 80 chars):**  
  `Listen to PDFs aloud offline with natural text-to-speech & background audio.`
* **Category:**  
  `Books & Reference` (or `Productivity`)
* **Content Rating:**  
  `Everyone` (PEGI 3)
* **Contains Ads:**  
  `Yes` (Google AdMob)
