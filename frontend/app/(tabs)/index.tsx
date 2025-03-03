import React, { useState } from 'react';
import { StyleSheet, Image, Alert, ActivityIndicator, Text, View, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function TabOneScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant permission to access the photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fallback to MediaTypeOptions
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const captureImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant permission to use the camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const classifyImage = async () => {
    if (!image) {
      Alert.alert('No Image Selected', 'Please upload or capture an image first.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('image', {
        uri: image,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch('http://192.168.0.100:8008/api/classify/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Something went wrong while classifying the image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediVisual</Text>
      <View style={styles.separator} />

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {!loading && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={captureImage}>
            <Text style={styles.buttonText}>Capture Image</Text>
          </TouchableOpacity>
          {image && (
            <TouchableOpacity style={styles.button} onPress={classifyImage}>
              <Text style={styles.buttonText}>Classify Image</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {result && <Text style={styles.result}>Classification Result: {result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separator: {
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '80%',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
});
