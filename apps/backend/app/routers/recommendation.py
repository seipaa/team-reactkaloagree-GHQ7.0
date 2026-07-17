"""Recommendation router for HIE recommendations."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.prediction import Prediction, Priority
from app.models.farm import Farm
from app.schemas.common import RecommendationResponse
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/recommendation", tags=["Recommendation"])


@router.get("", response_model=List[RecommendationResponse])
def get_all_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all recommendations sorted by priority.
    Shows all farms with their latest recommendations.
    """
    # Get predictions with recommendations
    if current_user.role == "FARMER":
        if current_user.farm_id:
            predictions = (
                db.query(Prediction)
                .filter(Prediction.farm_id == current_user.farm_id)
                .filter(Prediction.recommendation.isnot(None))
                .order_by(Prediction.created_at.desc())
                .all()
            )
        else:
            predictions = []
    else:
        predictions = (
            db.query(Prediction)
            .filter(Prediction.recommendation.isnot(None))
            .order_by(Prediction.created_at.desc())
            .all()
        )

    # Build recommendations with farm info
    recommendations = []
    seen_farms = set()
    
    for pred in predictions:
        if pred.farm_id in seen_farms:
            continue
        seen_farms.add(pred.farm_id)
        
        farm = db.query(Farm).filter(Farm.id == pred.farm_id).first()
        if farm:
            recommendations.append(RecommendationResponse(
                farm_id=farm.id,
                farm_name=farm.name,
                priority=pred.priority.value if pred.priority else "LOW",
                recommendation=pred.recommendation or "No recommendation",
                reason=pred.reason or "",
                harvest_readiness=pred.harvest_readiness or 0,
                disease_risk=pred.disease_risk,
                created_at=pred.created_at.isoformat(),
            ))

    # Sort by priority
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recommendations.sort(key=lambda x: priority_order.get(x.priority, 3))

    return recommendations


@router.get("/{farm_id}", response_model=RecommendationResponse)
def get_farm_recommendation(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Access Control: Farmers can only see their own farm recommendation
    if current_user.role == "FARMER" and current_user.farm_id != farm_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    # Get latest prediction for this farm
    prediction = (
        db.query(Prediction)
        .filter(Prediction.farm_id == farm_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )

    if not prediction:
        return {
            "farm_id": farm_id,
            "farm_name": "Unknown",
            "priority": "LOW",
            "recommendation": "No prediction available",
            "reason": "No analysis data yet",
            "harvest_readiness": 0,
            "disease_risk": None,
            "created_at": "",
        }

    farm = db.query(Farm).filter(Farm.id == farm_id).first()

    return RecommendationResponse(
        farm_id=farm_id,
        farm_name=farm.name if farm else "Unknown",
        priority=prediction.priority.value if prediction.priority else "LOW",
        recommendation=prediction.recommendation or "No recommendation",
        reason=prediction.reason or "",
        harvest_readiness=prediction.harvest_readiness or 0,
        disease_risk=prediction.disease_risk,
        created_at=prediction.created_at.isoformat(),
    )