"""BMKG Weather service for fetching weather data."""
from typing import Optional, Dict, Any
from datetime import datetime
import requests
from sqlalchemy.orm import Session

from app.config import settings
from app.models.weather import Weather
from app.schemas.weather import WeatherResponse


def fetch_bmkg_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch weather data from BMKG API.
    
    Source: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika Indonesia)
    Base URL: https://api.bmkg.go.id
    
    Args:
        lat: Latitude
        lon: Longitude
    
    Returns:
        Dict with weather data
    """
    try:
        # Try BMKG API v1
        url = f"{settings.bmkg_api_url}/v1/current"
        params = {"lat": lat, "lon": lon}
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Parse BMKG response
        if "data" in data and len(data["data"]) > 0:
            current = data["data"][0]
            location = current.get("location") or data.get("location")
            if not location:
                if abs(lat - (-6.81)) < 0.1 and abs(lon - 107.02) < 0.1:
                    location = "Cianjur, Jawa Barat"
                else:
                    location = "Jawa Barat, Indonesia"
            return {
                "temperature": current.get("t"),  # Temperature
                "humidity": current.get("hu"),    # Humidity
                "weather_code": current.get("weather"),
                "weather_desc": current.get("weather_desc"),
                "wind": current.get("ws"),         # Wind speed
                "rain": current.get("rh"),          # Rain humidity
                "warning": current.get("warning"),
                "location": location,
                "timestamp": datetime.utcnow(),
            }
        
        # If data structure is different, return what we have
        return {"error": "Unable to parse BMKG response", "raw": data}
        
    except requests.RequestException as e:
        print(f"BMKG API error: {e}")
        # Return mock data for demo purposes
        return generate_mock_weather(lat, lon)


def generate_mock_weather(lat: float = None, lon: float = None) -> Dict[str, Any]:
    """Generate realistic mock weather data for demo."""
    import random
    
    location = "Cianjur, Jawa Barat"
    if lat and lon:
        if abs(lat - (-6.81)) < 0.1 and abs(lon - 107.02) < 0.1:
            location = "Cianjur, Jawa Barat"
        else:
            location = "Jawa Barat, Indonesia"
            
    return {
        "temperature": round(random.uniform(26.0, 34.0), 1),
        "humidity": round(random.uniform(60.0, 95.0), 1),
        "weather_code": random.choice(["Cerah", "Berawan", "Hujan Ringan"]),
        "weather_desc": random.choice(["Sunny", "Cloudy", "Light Rain"]),
        "wind": round(random.uniform(2.0, 15.0), 1),
        "rain": round(random.uniform(0.0, 0.8), 2),
        "warning": None,
        "location": location,
        "timestamp": datetime.utcnow(),
    }


def cache_weather(db: Session, weather_data: Dict[str, Any], lat: float = None, lon: float = None) -> Weather:
    """Save weather data to database cache."""
    location = weather_data.get("location")
    if not location and lat and lon:
        if abs(lat - (-6.81)) < 0.1 and abs(lon - 107.02) < 0.1:
            location = "Cianjur, Jawa Barat"
        else:
            location = "Jawa Barat, Indonesia"
    elif not location:
        location = "Cianjur, Jawa Barat"
        
    weather = Weather(
        temperature=weather_data.get("temperature"),
        humidity=weather_data.get("humidity"),
        rain=weather_data.get("rain"),
        wind=weather_data.get("wind"),
        warning=weather_data.get("warning"),
        weather_code=weather_data.get("weather_code"),
        weather_desc=weather_data.get("weather_desc"),
        location=location,
        latitude=lat,
        longitude=lon,
        timestamp=weather_data.get("timestamp", datetime.utcnow()),
    )
    db.add(weather)
    db.commit()
    db.refresh(weather)
    return weather


def get_latest_weather(db: Session) -> Optional[Weather]:
    """Get the most recent cached weather data."""
    return db.query(Weather).order_by(Weather.created_at.desc()).first()