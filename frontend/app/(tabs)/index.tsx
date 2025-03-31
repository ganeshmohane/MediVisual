import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, ActivityIndicator, Text, View, TouchableOpacity, ScrollView } from 'react-native';

const GEMINI_API_KEY = '';

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
          contents: [{ parts: [{ text: `Provide health recommendations based on this analysis: ${JSON.stringify(data)}` }] }]
        }),
      });

      const suggestion = await response.json();
      setGeminiSuggestion(suggestion.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestions available.');
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to fetch health recommendations.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MediVisual</Text>
      <Text style={styles.subtitle}>Your health, our insights.</Text>
      
      <View style={styles.inputBlock}>
        <TextInput
          style={styles.input}
          placeholder="Fasting blood sugar level (mg/dL)"
          keyboardType="numeric"
          value={fasting}
          onChangeText={setFasting}
          placeholderTextColor="gainsboro" 
        />
        <TextInput
          style={styles.input}
          placeholder="Postprandial blood sugar level (mg/dL)"
          keyboardType="numeric"
          value={postprandial}
          onChangeText={setPostprandial}
          placeholderTextColor="gainsboro" 
        />
        <TouchableOpacity style={styles.button} onPress={analyzeDiabetes}>
          <Text style={styles.buttonText}>Check Diabetes Status</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#007bff" />}
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <Text>Diabetes Tier: {result.tier || 'N/A'}</Text>
          <Text>
            Reconstruction Error: {result.reconstruction_error ? result.reconstruction_error.toFixed(5) : 'N/A'}
          </Text>
          <Text>Possible Diabetes: {result.possible_diabetes ? 'Yes' : 'No'}</Text>
          <Text>Concerns: {result.concerns || 'No concerns detected'}</Text>
        </View>
      )}

      {geminiSuggestion && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.resultTitle}>Health Suggestions</Text>
          <Text>{geminiSuggestion}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
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
    borderColor: '#555',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#222',
    color: '#fff',
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
    backgroundColor: '#111',
    borderRadius: 8,
    width: '90%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  suggestionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
    width: '90%',
  },
});
