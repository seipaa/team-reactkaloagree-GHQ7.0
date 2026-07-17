"""Map router for map markers."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.farm import Farm
from app.models.prediction import Prediction
from app.schemas.common import MapMarker
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("", response_model=List[MapMarker])
def get_map_markers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all map markers with their status and priority.
    
    Status colors:
    - healthy: Green - No issues detected
    - near: Yellow - Near harvest readiness
    - ready: Red - Ready for harvest
    - disease: Black - Disease detected
    """
    if current_user.role == "FARMER":
        if current_user.farm_id:
            farms = db.query(Farm).filter(Farm.id == current_user.farm_id).all()
        else:
            farms = []
    else:
        farms = db.query(Farm).all()
    markers = []
    
    for farm in farms:
        # Get latest prediction
        latest_pred = (
            db.query(Prediction)
            .filter(Prediction.farm_id == farm.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        
        # Determine status
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
        
        markers.append(MapMarker(
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
    
    return markers