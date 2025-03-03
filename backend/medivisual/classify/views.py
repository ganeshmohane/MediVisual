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
