# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# PDFBox Android & FontBox (essential for PDF text extraction in minified release builds)
-keep class com.tom_roush.pdfbox.** { *; }
-dontwarn com.tom_roush.pdfbox.**
-keep class org.apache.fontbox.** { *; }
-dontwarn org.apache.fontbox.**

# BouncyCastle cryptography used by PDFBox
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

# Native Expo modules & TurboModules
-keep class expo.modules.** { *; }
-keep class expo.modules.speechengine.** { *; }
-keep class expo.modules.pdfengine.** { *; }
-keep class expo.modules.playbackservice.** { *; }
