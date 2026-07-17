"""Dashboard router for aggregated dashboard data."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.prediction import Prediction, Priority
from app.models.farm import Farm
from app.models.weather import Weather
from app.models.user import User
from app.schemas.common import DashboardResponse, MapMarker
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get aggregated dashboard data.
    
    Returns:
    - Total farms count
    - Ready harvest count (readiness > 70)
    - Near harvest count (readiness 50-70)
    - Disease alerts count
    - Weather alerts count
    - Latest predictions
    - All recommendations
    - Map markers with status
    """
    # Get farms based on role
    if current_user.role == "FARMER":
        if current_user.farm_id:
            farms = db.query(Farm).filter(Farm.id == current_user.farm_id).all()
        else:
            farms = []
    else:
        farms = db.query(Farm).all()
        
    total_farms = len(farms)
    
    # Get latest predictions for each farm
    predictions = []
    ready_count = 0
    near_count = 0
    disease_count = 0
    
    for farm in farms:
        latest_pred = (
            db.query(Prediction)
            .filter(Prediction.farm_id == farm.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        if latest_pred:
            predictions.append(latest_pred)
            # Count by readiness
            if latest_pred.harvest_readiness and latest_pred.harvest_readiness > 70:
                ready_count += 1
            elif latest_pred.harvest_readiness and latest_pred.harvest_readiness >= 50:
                near_count += 1
            # Count disease alerts
            if latest_pred.disease_risk == "HIGH":
                disease_count += 1
    
    # Get weather alerts
    latest_weather = db.query(Weather).order_by(Weather.created_at.desc()).first()
    weather_alerts = 0
    if latest_weather and latest_weather.warning:
        weather_alerts = 1
    
    # Build map markers
    map_markers = []
    for farm in farms:
        latest_pred = (
            db.query(Prediction)
            .filter(Prediction.farm_id == farm.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        
        # Determine status based on latest prediction
        if latest_pred:
            if latest_pred.disease_risk == "HIGH":
                status = "disease"
            elif latest_pred.harvest_readiness and latest_pred.harvest_readiness > 70:
                status = "ready"
            elif latest_pred.harvest_readiness and latest_pred.harvest_readiness >= 50:
                status = "near"
            else:
                status = "healthy"
            priority = latest_pred.priority.value if latest_pred.priority else "LOW"
        else:
            status = "healthy"
            priority = "LOW"
        
        map_markers.append(MapMarker(
            farm_id=farm.id,
            name=farm.name,
            latitude=farm.latitude,
            longitude=farm.longitude,
            status=status,
            priority=priority,
            latest_prediction={
                "ripeness": latest_pred.ripeness if latest_pred else None,
                "fruit_count": latest_pred.fruit_count if latest_pred else None,
                "harvest_readiness": latest_pred.harvest_readiness if latest_pred else None,
                "disease_risk": latest_pred.disease_risk if latest_pred else None,
            } if latest_pred else None
        ))
    
    # Get recommendations (same as recommendation endpoint)
    recommendations = []
    seen_farms = set()
    for pred in predictions:
        if pred.farm_id in seen_farms:
            continue
        seen_farms.add(pred.farm_id)
        farm = db.query(Farm).filter(Farm.id == pred.farm_id).first()
        if farm and pred.recommendation:
            recommendations.append({
                "farm_id": farm.id,
                "farm_name": farm.name,
                "priority": pred.priority.value if pred.priority else "LOW",
                "recommendation": pred.recommendation,
                "reason": pred.reason or "",
                "harvest_readiness": pred.harvest_readiness or 0,
                "disease_risk": pred.disease_risk,
                "created_at": pred.created_at.isoformat(),
            })
    
    # Sort recommendations by priority
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recommendations.sort(key=lambda x: priority_order.get(x.get("priority", "LOW"), 3))
    
    return DashboardResponse(
        total_farms=total_farms,
        ready_harvest_count=ready_count,
        near_harvest_count=near_count,
        disease_alerts=disease_count,
        weather_alerts=weather_alerts,
        predictions=[{
            "id": p.id,
            "farm_id": p.farm_id,
            "ripeness": p.ripeness,
            "fruit_count": p.fruit_count,
            "disease": p.disease.value if p.disease else "HEALTHY",
            "confidence": p.confidence,
            "recommendation": p.recommendation,
            "priority": p.priority.value if p.priority else "LOW",
            "reason": p.reason,
            "harvest_readiness": p.harvest_readiness,
            "disease_risk": p.disease_risk,
            "created_at": p.created_at.isoformat(),
        } for p in predictions[-10:]],  # Latest 10 predictions
        recommendations=recommendations,
        map_markers=map_markers
    )