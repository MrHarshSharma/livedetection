import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState('front');
  const [faceCount, setFaceCount] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedData, setCapturedData] = useState(null);

  const cameraRef = useRef(null);

  const isRunning = useRef(false);

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const runDetectionLoop = async () => {
    if (!cameraRef.current || !isRunning.current) return;

    try {
      /**
       * NOTE: expo-camera's takePictureAsync always writes a temporary file to disk
       * even when requesting base64. expo-face-detector's detectFacesAsync also
       * requires a file URI, not raw base64 data. 
       * 
       * For true 'memory-only' processing, consider switching to 
       * react-native-vision-camera with a frame processor.
       */
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        skipProcessing: true,
        shutterSound: false,
        base64: true, // This stores the image data in a local variable (photo.base64)
      });

      if (!isRunning.current) return;

      // We still use photo.uri here because detectFacesAsync requires a file path
      const result = await FaceDetector.detectFacesAsync(photo.uri, {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      });

      if (isRunning.current) {
        setFaceCount(result.faces.length);
        // You can now use photo.base64 if you need the image data in memory
        // console.log('Base64 length:', photo.base64?.length);
      }
    } catch (error) {
      // Ignore errors in the loop to keep it running
    } finally {
      if (isRunning.current) {
        // Schedule next detection after a short delay
        setTimeout(runDetectionLoop, 100);
      }
    }
  };

  useEffect(() => {
    if (showCamera) {
      isRunning.current = true;
      // Small delay to ensure camera is ready
      const timer = setTimeout(() => runDetectionLoop(), 1000);
      return () => {
        isRunning.current = false;
        clearTimeout(timer);
      };
    } else {
      isRunning.current = false;
    }
  }, [showCamera]);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setShowCamera(true);
      }
    } else {
      setShowCamera(true);
    }
  };

  const closeCamera = () => {
    setShowCamera(false);
    setFaceCount(0);
    setCapturedData(null);
  };

  const captureFrame = async () => {
    if (!cameraRef.current) return;

    isRunning.current = false;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      const now = new Date();
      setCapturedData({
        uri: photo.uri,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        faces: faceCount,
      });
    } catch (error) {
      console.log('Error capturing photo:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedData(null);
    isRunning.current = true;
    setTimeout(runDetectionLoop, 500);
  };

  if (showCamera) {
    if (capturedData) {
      return (
        <SafeAreaProvider>
          <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.capturedContainer}>
              <Image
                source={{ uri: capturedData.uri }}
                style={styles.capturedImage}
                resizeMode="contain"
              />
              <View style={styles.captureOverlay}>
                <View style={styles.captureInfo}>
                  <Text style={styles.captureInfoLabel}>Date</Text>
                  <Text style={styles.captureInfoText}>{capturedData.date}</Text>
                  <Text style={styles.captureInfoLabel}>Time</Text>
                  <Text style={styles.captureInfoText}>{capturedData.time}</Text>
                  <Text style={styles.captureInfoLabel}>Detected</Text>
                  <Text style={styles.captureInfoFaces}>
                    {capturedData.faces === 0 ? 'No faces' : `${capturedData.faces} face${capturedData.faces > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.flipButton} onPress={retakePhoto}>
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeCamera}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <StatusBar style="light" />
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            animateShutter={false}
          />
          <View style={styles.faceCounter}>
            <Text style={styles.faceCountText}>
              {faceCount === 0 ? 'No faces' : `${faceCount} face${faceCount > 1 ? 's' : ''}`}
            </Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={captureFrame}>
              <Text style={styles.buttonText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeCamera}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Camera App</Text>
          <Text style={styles.subtitle}>Tap the button to open camera</Text>

          <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
            <Text style={styles.cameraButtonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 50,
  },
  cameraButton: {
    backgroundColor: '#4361ee',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  faceCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#4361ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  faceCountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 20,
    backgroundColor: '#1a1a2e',
  },
  flipButton: {
    backgroundColor: '#4361ee',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    backgroundColor: '#e63946',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  capturedContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  captureInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 16,
  },
  captureInfoLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  captureInfoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  captureInfoFaces: {
    color: '#4361ee',
    fontSize: 24,
    fontWeight: '700',
  },
});
