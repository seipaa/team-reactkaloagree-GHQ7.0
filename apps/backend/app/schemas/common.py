"""Common Pydantic schemas for shared responses."""
from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class MapMarker(BaseModel):
    """Schema for map marker."""
    farm_id: int
    name: str
    latitude: float
    longitude: float
    status: str  # healthy, near, ready, disease
    priority: Optional[str] = None
    latest_prediction: Optional[Dict[str, Any]] = None


class DashboardResponse(BaseModel):
    """Schema for dashboard aggregation response."""
    total_farms: int
    ready_harvest_count: int
    near_harvest_count: int
    disease_alerts: int
    weather_alerts: int
    predictions: List[Any]
    recommendations: List[Any]
    map_markers: List[MapMarker]


class UploadResponse(BaseModel):
    """Schema for image upload response."""
    image_url: str
    image_id: int
    message: str
    ripeness: Optional[float] = None
    fruit_count: Optional[int] = None
    disease: Optional[str] = None
    recommendation: Optional[str] = None
    priority: Optional[str] = None
    reason: Optional[str] = None
    harvest_readiness: Optional[float] = None
    disease_risk: Optional[str] = None


class HIEInput(BaseModel):
    """Schema for Harvest Intelligence Engine input."""
    ripeness: float
    fruit_count: int
    disease: str
    confidence: float
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rain_forecast: Optional[float] = None
    weather_warning: Optional[str] = None


class HIEOutput(BaseModel):
    """Schema for Harvest Intelligence Engine output."""
    harvest_readiness: float
    harvest_priority: str
    disease_risk: str
    recommendation: str
    reason: str


class RecommendationResponse(BaseModel):
    """Schema for recommendation response."""
    farm_id: int
    farm_name: str
    priority: str
    recommendation: str
    reason: str
    harvest_readiness: float
    disease_risk: Optional[str] = None
    created_at: str


class ImageResponse(BaseModel):
    """Schema for image response."""
    id: int
    farm_id: int
    image_url: str
    captured_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class FarmDetailResponse(BaseModel):
    """Schema for farm detail response."""
    farm: Dict[str, Any]
    latest_prediction: Optional[Dict[str, Any]] = None
    predictions_history: List[Dict[str, Any]] = []
    images: List[ImageResponse] = []


class MessageResponse(BaseModel):
    """Schema for simple message response."""
    message: str
    success: bool = True