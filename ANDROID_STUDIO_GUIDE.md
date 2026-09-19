# Android Studio Project Guide

The space side-scroller has been fully configured for Android Studio using Capacitor with a complete native Android Gradle project.

## Project Structure
- **Root Android Directory**: `/android`
- **Application Module**: `/android/app`
- **Package ID**: `com.spaceshooter.app`
- **Main Activity**: `com.spaceshooter.app.MainActivity`
- **Android Manifest**: `/android/app/src/main/AndroidManifest.xml`
- **Assets**: `/android/app/src/main/assets/public/`

## How to Open in Android Studio
1. Launch **Android Studio**.
2. Select **Open an existing project** (or **File > Open**).
3. Choose the `android` folder in the project root.
4. Allow Gradle to sync dependencies and index the project.

## Running on an Emulator or Physical Device
1. Connect an Android device with USB debugging enabled, or start an Android Virtual Device (AVD).
2. In Android Studio, select the `app` run configuration and click **Run** (green play button or `Shift + F10`).
3. The game will launch in immersive edge-to-edge landscape mode with tactile thumbstick flight and combat controls.

## Generating Release APK / AAB
1. In Android Studio, go to **Build > Generate Signed Bundle / APK**.
2. Choose **Android App Bundle (AAB)** for Google Play, or **APK** for direct sideloading.
3. Select or create your keystore and build the release package.

## Useful Scripts
- `npm run build:android`: Builds the web game and synchronizes all assets into the Android Studio project.
- `npm run cap:sync`: Syncs any web updates or plugin changes to the `android/` directory.
- `npm run cap:open`: Directly launches the Android project in your installed Android Studio.
