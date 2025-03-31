import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
// import logo from '../assets/images/mv-logo.png'

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/mv-logo.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to MediVisual</Text>
      <Text style={styles.description}>
        MediVisual is your AI-powered health companion, helping you analyze medical data and get insights instantly. 
        Simply input your health metrics, and let our advanced models provide you with valuable recommendations.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000', // Keeping the default dark theme
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 22,
  },
});