import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AttendanceScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState('IN');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <TouchableOpacity style={styles.blackButton} onPress={requestPermission}>
          <Text style={styles.whiteText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
    });
    setPhoto(pic);
  };

  const submitAttendance = async () => {
    if (!name.trim()) return Alert.alert('Please enter name');
    if (!photo?.base64) return Alert.alert('Please capture face');

    setLoading(true);
    try {
      await fetch('http://192.168.0.104:5000/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: mode,
          timestamp: new Date().toISOString(),
          photo: photo.base64,
        }),
      });

      Alert.alert('Success', `${mode} recorded`);
      setPhoto(null);
      setName('');
    } catch {
      Alert.alert('Error', 'Backend not reachable');
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#22e3a6', '#4facfe']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* SMALL CENTERED BOX */}
      <View style={styles.boxWrapper}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          <Text style={styles.heading}>
            Welcome to <Text style={{ color: '#2563eb' }}>Sankalp Concepts</Text>
          </Text>

          <Text style={styles.subheading}>
            {mode === 'IN' ? 'Secure face check-in' : 'Secure face check-out'}
          </Text>

          {/* SMALL CAMERA */}
          <View style={styles.cameraBox}>
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            <View style={styles.faceFrame} />
          </View>

          <Text style={styles.time}>{time.toLocaleTimeString()}</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggle, mode === 'IN' && styles.inActive]}
              onPress={() => setMode('IN')}
            >
              <Text style={styles.toggleText}>IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, mode === 'OUT' && styles.outActive]}
              onPress={() => setMode('OUT')}
            >
              <Text style={styles.toggleText}>OUT</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.faceButton} onPress={capturePhoto}>
            <Text style={styles.faceText}>👤 Face ID</Text>
          </TouchableOpacity>

          {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}

          <TouchableOpacity style={styles.submit} onPress={submitAttendance}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Confirm</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footer}>Face data used only for attendance</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  boxWrapper: {
    width: 320,
  },

  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  icon: { fontSize: 26 },

  heading: { fontSize: 17, fontWeight: '700', textAlign: 'center' },

  subheading: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },

  cameraBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#22c55e',
    marginVertical: 8,
  },

  camera: { width: '100%', height: '100%' },

  faceFrame: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 10,
  },

  time: { fontSize: 12, color: '#2563eb', marginBottom: 6 },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },

  toggleRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },

  toggle: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  inActive: { backgroundColor: '#22c55e' },
  outActive: { backgroundColor: '#ef4444' },

  toggleText: { color: '#fff', fontWeight: '700' },

  faceButton: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },

  faceText: { fontWeight: '600' },

  preview: {
    width: 70,
    height: 90,
    borderRadius: 8,
    marginBottom: 6,
  },

  submit: {
    width: '100%',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  submitText: { color: '#fff', fontWeight: '700' },

  footer: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },

  permission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionTitle: { fontSize: 18, marginBottom: 10 },

  blackButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 12,
  },

  whiteText: { color: '#fff' },
});