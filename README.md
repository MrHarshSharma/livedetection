# SimpleApp - Live Face Detection

A React Native application built with Expo for real-time face detection using the device camera.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) (for macOS users) or [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/client) app on your physical device (optional)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Install native iOS dependencies:
   ```bash
   npx pod-install
   ```

### Running the App
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Development**: `npx expo start`

---

## Libraries Used

- **[expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)**: Provides a React component that renders a preview of the device's front or back camera.
- **[expo-face-detector](https://docs.expo.dev/versions/latest/sdk/facedetector/)**: Uses Google ML Kit on Android and Apple Vision on iOS to detect faces in real-time.
- **[react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)**: Handles safe area insets for modern devices with notches or home indicators.
- **[expo-status-bar](https://docs.expo.dev/versions/latest/sdk/status-bar/)**: Manages the application status bar styling.

---

## Assumptions Made

1. **Development Environment**: It is assumed that the user has a functional React Native / Expo development environment set up (Xcode for iOS, Android Studio for Android).
2. **Device Permissions**: The app assumes the user will grant camera permissions. Basic handling is included, but enterprise-level permission management is not implemented.
3. **Face Detection Accuracy**: The detection uses the `fast` mode of `expo-face-detector` for performance. This prioritizes speed over high precision or landmark detection (like eyes/nose tracking).
4. **Hardware Performance**: The real-time detection loop is tuned with a `100ms` delay to balance UI responsiveness and processing load, assuming modern mobile hardware.
5. **Disk I/O**: Due to `expo-camera` limitations, it is assumed that writing temporary images to the disk for processing is acceptable, as the library does not support direct memory-to-memory frame processing.
