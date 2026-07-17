"""Farm management router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.farm import Farm
from app.models.prediction import Prediction
from app.models.image import Image
from app.models.user import User
from app.schemas.farm import FarmResponse, FarmCreate, FarmWithPrediction
from app.schemas.prediction import PredictionResponse
from app.schemas.common import FarmDetailResponse, ImageResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.get("", response_model=List[FarmResponse])
def get_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all farms.
    
    - Farmers only see their own farm
    - Cooperatives and Food Authorities see all farms
    """
    if current_user.role == "FARMER":
        # Farmers only see their own farm
        if current_user.farm_id:
            farm = db.query(Farm).filter(Farm.id == current_user.farm_id).first()
            return [farm] if farm else []
        return []
    
    # Cooperatives and Food Authorities see all farms
    return db.query(Farm).all()


@router.post("", response_model=FarmResponse, status_code=201)
def create_farm(
    farm_data: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new farm."""
    farm = Farm(
        name=farm_data.name,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        variety=farm_data.variety,
        owner=farm_data.owner,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{farm_id}", response_model=FarmDetailResponse)
def get_farm_detail(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific farm.
    
    Includes:
    - Farm details
    - Latest prediction
    - Prediction history
    - Recent images
    """
    # Get farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # FARMER: can only access their own farm
    if current_user.role == "FARMER" and current_user.farm_id != farm_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get latest prediction
    latest_prediction = (
        db.query(Prediction)
        .filter(Prediction.farm_id == farm_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    
    # Get prediction history (last 10)
    predictions_history = (
        db.query(Prediction)
        .filter(Prediction.farm_id == farm_id)
        .order_by(Prediction.created_at.desc())
        .limit(10)
        .all()
    )
    
    # Get recent images
    images = (
        db.query(Image)
        .filter(Image.farm_id == farm_id)
        .order_by(Image.created_at.desc())
        .limit(5)
        .all()
    )
    
    return FarmDetailResponse(
        farm={
            "id": farm.id,
            "name": farm.name,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "variety": farm.variety,
            "owner": farm.owner,
            "created_at": farm.created_at.isoformat(),
        },
        latest_prediction={
            "id": latest_prediction.id,
            "ripeness": latest_prediction.ripeness,
            "fruit_count": latest_prediction.fruit_count,
            "disease": latest_prediction.disease.value if latest_prediction.disease else "HEALTHY",
            "confidence": latest_prediction.confidence,
            "recommendation": latest_prediction.recommendation,
            "priority": latest_prediction.priority.value if latest_prediction.priority else "LOW",
            "reason": latest_prediction.reason,
            "harvest_readiness": latest_prediction.harvest_readiness,
            "disease_risk": latest_prediction.disease_risk,
            "created_at": latest_prediction.created_at.isoformat(),
        } if latest_prediction else None,
        predictions_history=[{
            "id": p.id,
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
        } for p in predictions_history],
        images=[ImageResponse(
            id=img.id,
            farm_id=img.farm_id,
            image_url=img.image_url,
            captured_at=img.captured_at.isoformat() if img.captured_at else None,
            created_at=img.created_at.isoformat(),
        ) for img in images],
    )