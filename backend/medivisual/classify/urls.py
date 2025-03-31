from django.urls import path
from .views import ImageClassificationView, PredictionView

urlpatterns = [
    path('classify/', ImageClassificationView.as_view(), name='classify-image'),
    path('predict-diabetes/', PredictionView.as_view(), name='predict-diabetes'),
]
