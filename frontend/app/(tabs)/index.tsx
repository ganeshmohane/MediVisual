import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, Alert, ActivityIndicator, Text, View, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';

const GEMINI_API_KEY = 'GEMINI_API_KEY';

export default function DiabetesChecker() {
  const [fasting, setFasting] = useState('');
  const [postprandial, setPostprandial] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [geminiSuggestion, setGeminiSuggestion] = useState('');

  const analyzeDiabetes = async () => {
    if (!fasting || !postprandial) {
      Alert.alert('Missing Input', 'Please enter both fasting and postprandial blood sugar levels.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://192.168.0.101:8000/api/predict-diabetes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: [parseFloat(fasting), parseFloat(postprandial)],
        }),
      });
      
      const data = await response.json();
      setResult(data);
      fetchGeminiSuggestions(data);
      console.log(result)
    } catch (error) {
      console.error('Error analyzing diabetes:', error);
      Alert.alert('Error', 'Something went wrong while analyzing your data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeminiSuggestions = async (data) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Provide health recommendations in short points: ${JSON.stringify(data)}` }] }]
        }),
      });
      
      const suggestion = await response.json();
      setGeminiSuggestion(suggestion.candidates?.[0]?.content?.parts?.[0]?.text.replace(/\*\*(.*?)\*\*/g, '$1') || 'No suggestions available.');
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to fetch health recommendations.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>MediVisual</Text>
          <Text style={styles.subtitle}>Your health, our insights.</Text>
          
          <View style={styles.inputBlock}>
            <TextInput
              style={styles.input}
              placeholder="Fasting blood sugar level (mg/dL)"
              keyboardType="numeric"
              value={fasting}
              onChangeText={setFasting}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Postprandial blood sugar level (mg/dL)"
              keyboardType="numeric"
              value={postprandial}
              onChangeText={setPostprandial}
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.button} onPress={analyzeDiabetes} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Check Diabetes Status'}</Text>
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator size="large" color="#007bff" />}
          
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Diabetes Prediction: {result.possible_diabetes}</Text>
              <Text style={styles.resultText}>• Further medical consultation recommended: {geminiSuggestion}</Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputBlock: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    width: '90%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  }
});
