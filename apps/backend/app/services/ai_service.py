"""AI service for harvest prediction integration - Updated with Roboflow."""
import random
from typing import Dict, Any, Optional
import requests
import base64
import io

from app.config import settings
from app.services.roboflow_service import get_roboflow_service


def call_ai_api(image_url: str) -> Dict[str, Any]:
    """
    Call the AI service to get harvest predictions.
    
    This function integrates with Roboflow AI models for:
    1. Disease detection (Model 1)
    2. Fruit counting (Model 2)
    3. Health classification (Model 3)
    
    Falls back to mock data if Roboflow API is unavailable.
    
    Returns:
        Dict containing: ripeness, fruit_count, disease, confidence
    """
    # Try to get image data from URL
    try:
        # Resolve relative URL to internal MinIO endpoint if needed
        actual_url = image_url
        if image_url.startswith("/agromesh-images/"):
            actual_url = f"http://minio:9000{image_url}"
        elif image_url.startswith("/"):
            actual_url = f"http://minio:9000/agromesh-images{image_url}"
        
        # Download image
        response = requests.get(actual_url, timeout=10)
        response.raise_for_status()
        image_data = response.content
        
        # Use Roboflow service for predictions
        roboflow_service = get_roboflow_service()
        result = roboflow_service.predict_all(image_data)
        
        return {
            "ripeness": result.get("ripeness", 50),
            "fruit_count": result.get("fruit_count", 0),
            "disease": result.get("disease", "HEALTHY"),
            "confidence": result.get("overall_confidence", 0.5),
            # Additional metadata from Roboflow
            "disease_confidence": result.get("disease_confidence", 0.5),
            "fruit_count_confidence": result.get("fruit_count_confidence", 0.5),
            "is_healthy": result.get("is_healthy", True),
            "health_confidence": result.get("health_confidence", 0.5),
            "model_1_detected": result.get("model_1_detected"),
            "model_2_count": result.get("model_2_count", 0),
            "model_3_health_class": result.get("model_3_health_class"),
            "source": "roboflow"
        }
        
    except Exception as e:
        print(f"Roboflow API call failed: {e}")
        print("Falling back to mock data...")
        return generate_mock_prediction()


def call_ai_api_with_image_data(image_data: bytes) -> Dict[str, Any]:
    """
    Call AI service with raw image data.
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        Dict containing: ripeness, fruit_count, disease, confidence
    """
    try:
        # Use Roboflow service for predictions
        roboflow_service = get_roboflow_service()
        result = roboflow_service.predict_all(image_data)
        
        return {
            "ripeness": result.get("ripeness", 50),
            "fruit_count": result.get("fruit_count", 0),
            "disease": result.get("disease", "HEALTHY"),
            "confidence": result.get("overall_confidence", 0.5),
            # Additional metadata from Roboflow
            "disease_confidence": result.get("disease_confidence", 0.5),
            "fruit_count_confidence": result.get("fruit_count_confidence", 0.5),
            "is_healthy": result.get("is_healthy", True),
            "health_confidence": result.get("health_confidence", 0.5),
            "model_1_detected": result.get("model_1_detected"),
            "model_2_count": result.get("model_2_count", 0),
            "model_3_health_class": result.get("model_3_health_class"),
            "source": "roboflow"
        }
        
    except Exception as e:
        print(f"Roboflow API call failed: {e}")
        print("Falling back to mock data...")
        return generate_mock_prediction()


def generate_mock_prediction() -> Dict[str, Any]:
    """Generate realistic mock prediction data for demo."""
    # Simulate different harvest scenarios
    scenarios = [
        {"ripeness": 87.5, "fruit_count": 18, "disease": "HEALTHY", "confidence": 0.94},
        {"ripeness": 72.3, "fruit_count": 15, "disease": "HEALTHY", "confidence": 0.91},
        {"ripeness": 45.8, "fruit_count": 22, "disease": "HEALTHY", "confidence": 0.88},
        {"ripeness": 91.2, "fruit_count": 12, "disease": "HEALTHY", "confidence": 0.96},
        {"ripeness": 78.6, "fruit_count": 19, "disease": "ANTHRACNOSE", "confidence": 0.89},
        {"ripeness": 65.4, "fruit_count": 16, "disease": "POWDERY_MILDEW", "confidence": 0.85},
        {"ripeness": 55.2, "fruit_count": 20, "disease": "HEALTHY", "confidence": 0.92},
        {"ripeness": 83.7, "fruit_count": 14, "disease": "HEALTHY", "confidence": 0.95},
    ]
    
    return random.choice(scenarios)