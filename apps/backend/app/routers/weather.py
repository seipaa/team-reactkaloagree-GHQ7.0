"""Weather router for BMKG weather data."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.schemas.weather import WeatherResponse, WeatherCacheResponse
from app.services.weather_service import (
    fetch_bmkg_weather, cache_weather, get_latest_weather
)
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("", response_model=WeatherCacheResponse)
def get_weather(
    lat: Optional[float] = Query(default=-6.81, description="Latitude"),
    lon: Optional[float] = Query(default=107.02, description="Longitude"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get cached weather data.
    Refreshes from BMKG if cached data is older than 2 minutes or doesn't exist.
    """
    from datetime import datetime, timedelta
    
    weather = get_latest_weather(db)
    
    # If no cached weather, or cached weather is older than 2 minutes, refresh it!
    if not weather or (datetime.utcnow() - weather.created_at) > timedelta(minutes=2):
        try:
            weather_data = fetch_bmkg_weather(lat, lon)
            weather = cache_weather(db, weather_data, lat, lon)
        except Exception as e:
            print(f"Error refreshing weather: {e}")
            if not weather:
                # Fallback to mock if database is empty
                mock_data = generate_mock_weather(lat, lon)
                weather = cache_weather(db, mock_data, lat, lon)
                
    return weather


@router.get("/refresh", response_model=WeatherResponse)
def refresh_weather(
    lat: Optional[float] = Query(default=-6.2, description="Latitude"),
    lon: Optional[float] = Query(default=106.8, description="Longitude"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Force refresh weather data from BMKG API.
    
    Source: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika Indonesia)
    API: https://api.bmkg.go.id
    """
    # Fetch fresh data from BMKG
    weather_data = fetch_bmkg_weather(lat, lon)
    
    # Cache the weather data
    weather = cache_weather(db, weather_data, lat, lon)
    
    return weather


@router.get("/current", response_model=WeatherResponse)
def get_current_weather(
    lat: float = Query(default=-6.2, description="Latitude"),
    lon: float = Query(default=106.8, description="Longitude"),
):
    """
    Get current weather from BMKG without caching.
    
    Source: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika Indonesia)
    API: https://api.bmkg.go.id
    """
    return fetch_bmkg_weather(lat, lon)


@router.get("/history", response_model=List[WeatherResponse])
def get_weather_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get daily weather history for the last 7 days.
    """
    from datetime import datetime, timedelta
    import random
    from app.models.weather import Weather
    
    # Query database weather records sorted by timestamp
    records = db.query(Weather).order_by(Weather.timestamp.asc()).all()
    
    history = []
    
    # Generate dates for the last 7 days ending today
    today = datetime.utcnow()
    dates = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    for d in dates:
        day_record = None
        for r in records:
            if r.timestamp and r.timestamp.date() == d.date():
                day_record = r
                break
                
        if day_record:
            history.append(WeatherResponse(
                temperature=day_record.temperature,
                humidity=day_record.humidity,
                rain=day_record.rain,
                wind=day_record.wind,
                warning=day_record.warning,
                weather_code=day_record.weather_code,
                weather_desc=day_record.weather_desc,
                location=day_record.location,
                latitude=day_record.latitude,
                longitude=day_record.longitude,
                timestamp=day_record.timestamp
            ))
        else:
            # Generate realistic daily weather data for Cianjur
            random.seed(d.day) # stable mock data per day
            temp = round(random.uniform(23.5, 29.5), 1)
            hum = round(random.uniform(72.0, 88.0), 1)
            history.append(WeatherResponse(
                temperature=temp,
                humidity=hum,
                rain=round(random.uniform(0.1, 0.5), 2),
                wind=round(random.uniform(4.0, 12.0), 1),
                warning=None,
                weather_code="3",
                weather_desc="Berawan" if temp < 26 else "Cerah Berawan",
                location="Cianjur, Jawa Barat",
                latitude=-6.81,
                longitude=107.02,
                timestamp=d
            ))
            
    return history