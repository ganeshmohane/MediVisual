from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ImageSerializer
from PIL import Image
import os
from tensorflow.keras.models import load_model
import numpy as np

# Get the absolute path for the 'weights' folder inside the 'classify' app
model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),  # current file's directory
    'weights',  # 'weights' folder
    'brain_tumor.h5'  # model file
)

# Load the TensorFlow model
try:
    model = load_model(model_path)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None  # Handle the error if model loading fails

class ImageClassificationView(APIView):
    print("Triggered")
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        serializer = ImageSerializer(data=request.data)
        if serializer.is_valid():
            # Load the image
            image_file = request.FILES['image']
            image = Image.open(image_file)
            
            # Preprocess the image (this may vary depending on your model)
            image = self.preprocess_image(image)
            
            # Make the prediction
            result = self.classify_image(image)
            return JsonResponse({'result': result})
        else:
            return JsonResponse({'error': 'Invalid data'}, status=400)

    def preprocess_image(self, image):
        # Implement any preprocessing required for your model
        # Example: resize, normalize, etc.
        image = image.resize((200, 200))  # Resize to the expected input size of the model
        image = np.array(image)  # Convert image to numpy array

        # Normalize the image if needed (assuming the model needs values in the range [0, 1])
        image = image.astype('float32') / 255.0  # Normalize pixel values to [0, 1]

        # Add a batch dimension (model expects a batch of images)
        image = np.expand_dims(image, axis=0)  # Shape becomes (1, 224, 224, 3) for color image

        return image

    def classify_image(self, image):
        # Pass the image through the model to get a classification result
        try:
            prediction = model.predict(image)  # Make prediction with the model
            predicted_class = np.argmax(prediction, axis=1)  # Get the class index with the highest probability
            print(prediction, predicted_class)
            return str(predicted_class[0])  # Return the class index as a string
        except Exception as e:
            print(f"Error in classification: {e}")
            return "Error"


# Pred Diabetes #########################################
import os
import numpy as np
import pickle
from django.http import JsonResponse
from rest_framework.views import APIView
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

# Load the trained scaler
scaler_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'weights', 'scaler.pkl')
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'weights', 'diabetes.keras')

try:
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)

    # Check if the scaler is fitted
    if not hasattr(scaler, "data_min_"):
        print("Scaler is not fitted. Initializing and fitting a new one.")
        scaler = MinMaxScaler()
        scaler.fit(np.array([[0, 0], [200, 200]]))  # Example fitting range, modify as needed
except Exception as e:
    print(f"Error loading scaler: {e}. Initializing a default scaler.")
    scaler = MinMaxScaler()
    scaler.fit(np.array([[0, 0], [200, 200]]))  # Fit with default range


# Load the trained autoencoder model
def load_model_safely():
    try:
        return load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

autoencoder = load_model_safely()

# Define the threshold for classification (adjust based on Colab training results)
THRESHOLD = 0.2  # Update with actual threshold value from Colab

class PredictionView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            data = request.data.get('features')  # Expecting a list of [BSL_Fasting, BSL_PP]
            print(f"Received data from frontend: {data}")

            if not isinstance(data, list) or len(data) != 2:
                return JsonResponse({'error': 'Invalid input format. Expected a list of two numbers [BSL_Fasting, BSL_PP].'}, status=400)

            # Preprocess input
            processed_data = self.preprocess_input(data)
            print(f"Processed data shape: {processed_data.shape}")

            # Ensure model is loaded
            if autoencoder is None:
                return JsonResponse({'error': 'Model failed to load. Check server logs.'}, status=500)

            # Get model prediction
            result, reconstruction_error = self.classify_data(processed_data)
            return JsonResponse({
                'possible_diabetes': 'Yes' if result else 'No',
                'reconstruction_error': float(reconstruction_error)  # Convert to standard Python float
            })
        except Exception as e:
            print(f"Error in POST request: {e}")
            return JsonResponse({'error': str(e)}, status=500)

    def preprocess_input(self, data):
        try:
            # Convert to NumPy array and normalize using the same scaler as in training
            data = np.array(data, dtype=np.float32).reshape(1, -1)  # Ensure correct shape
            data_scaled = scaler.transform(data)  # Apply scaling
            return data_scaled
        except Exception as e:
            print(f"Error in preprocessing: {e}")
            raise ValueError("Invalid input format for preprocessing.")

    def classify_data(self, data):
        try:
            reconstructed = autoencoder.predict(data)
            reconstruction_error = np.mean(np.abs(data - reconstructed), axis=1)[0]

            # Determine if diabetes is detected based on the threshold
            possible_diabetes = reconstruction_error > THRESHOLD
            print(f"Diabetes detected: {possible_diabetes}, Reconstruction error: {reconstruction_error}")
            return possible_diabetes, reconstruction_error
        except Exception as e:
            print(f"Error in classification: {e}")
            return False, "Error"
