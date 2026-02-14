import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';

export default function AttendanceScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Logic States
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mode, setMode] = useState('IN');
  
  // Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');

  // --- MOCK REGISTRATION ACTION ---
  const handleRegister = () => {
    if (!regName.trim()) return Alert.alert("Error", "Please enter a name");
    
    setLoading(true);
    // Simulate uploading photo to Python backend
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", `${regName} has been added to the database!`);
      setIsRegistering(false);
      setRegName('');
    }, 2000);
  };

  // --- MOCK ATTENDANCE ACTION ---
  const handleAutoSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
      }, 3000);
    }, 1500);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={{color: '#fff'}}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <LinearGradient colors={['#059669', '#10b981']} style={styles.container}>
        <View style={styles.card}>
          <Text style={{fontSize: 50}}>✅</Text>
          <Text style={styles.successTitle}>{mode} RECORDED</Text>
          <Text style={styles.nameText}>{name || "Kushal Karthik"}</Text>
          <Text style={styles.footer}>Ready for next person...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.card}>
        <Text style={styles.brand}>SANKALP CONCEPTS</Text>
        
        {/* Camera Display */}
        <View style={[styles.cameraBox, isRegistering ? {borderColor: '#2563eb'} : {borderColor: '#334155'}]}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" />
        </View>

        {!isRegistering ? (
          /* ATTENDANCE UI */
          <View style={{width: '100%', alignItems: 'center'}}>
            <Text style={styles.statusText}>[ SCANNING MODE ]</Text>
            <View style={styles.modeContainer}>
              <Text style={[styles.modeBtn, mode === 'IN' && styles.btnIn]} onPress={() => setMode('IN')}>IN</Text>
              <Text style={[styles.modeBtn, mode === 'OUT' && styles.btnOut]} onPress={() => setMode('OUT')}>OUT</Text>
            </View>
            
            <TouchableOpacity style={styles.regToggle} onPress={() => setIsRegistering(true)}>
              <Text style={styles.regToggleText}>Register New Staff</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* REGISTRATION UI */
          <View style={{width: '100%'}}>
            <Text style={styles.regTitle}>New User Registration</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter Name (e.g. Rahul Sharma)" 
              value={regName}
              onChangeText={setRegName}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.regSubmit} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.regSubmitText}>Capture & Register</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegistering(false)}>
              <Text style={styles.cancelText}>Back to Scanner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: 300, backgroundColor: '#fff', borderRadius: 30, padding: 25, alignItems: 'center', elevation: 20 },
  brand: { fontSize: 14, fontWeight: '900', color: '#94a3b8', letterSpacing: 2, marginBottom: 15 },
  cameraBox: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', borderWidth: 4, marginBottom: 15 },
  camera: { flex: 1 },
  statusText: { color: '#64748b', fontWeight: 'bold', fontSize: 12, marginBottom: 10 },
  modeContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, width: '100%' },
  modeBtn: { flex: 1, textAlign: 'center', paddingVertical: 10, borderRadius: 10, fontWeight: 'bold', color: '#94a3b8' },
  btnIn: { backgroundColor: '#22c55e', color: '#fff' },
  btnOut: { backgroundColor: '#ef4444', color: '#fff' },
  // Registration Styles
  regTitle: { textAlign: 'center', fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' },
  regSubmit: { backgroundColor: '#2563eb', width: '100%', padding: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  regSubmitText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { textAlign: 'center', color: '#64748b', marginTop: 15, fontSize: 12, textDecorationLine: 'underline' },
  regToggle: { marginTop: 20 },
  regToggleText: { color: '#2563eb', fontWeight: 'bold' },
  // Success
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#059669', marginTop: 10 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  footer: { fontSize: 11, color: '#94a3b8', marginTop: 15 },
  btn: { backgroundColor: '#22c55e', padding: 15, borderRadius: 10 }
});