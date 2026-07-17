"""Upload router for handling image uploads from ESP32."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import os

from app.database import get_db
from app.models.farm import Farm
from app.models.image import Image
from app.schemas.common import UploadResponse
from app.services.minio_service import upload_image, ensure_bucket_exists
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_image_endpoint(
    file: UploadFile = File(...),
    farm_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image and run AI prediction on it.
    
    This endpoint:
    1. Saves the image to MinIO
    2. Runs AI prediction (Roboflow)
    3. Fetches latest weather data (BMKG)
    4. Runs Harvest Intelligence Engine (HIE)
    5. Saves prediction & image records to database
    """
    # Verify farm exists
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
        
    # FARMER: can only upload to their own farm
    if current_user.role == "FARMER" and current_user.farm_id != farm_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Read file content
    content = await file.read()
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP are allowed.")
    
    # Validate file size (max 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    try:
        # Ensure MinIO bucket exists
        ensure_bucket_exists()
        
        # Upload to MinIO
        image_url, object_name = upload_image(content, file.filename, farm_id)
        
        # Create image record
        image = Image(
            farm_id=farm_id,
            image_url=image_url,
            object_name=object_name,
            captured_at=datetime.utcnow(),
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        # Trigger AI Prediction and HIE rules
        from app.services.ai_service import call_ai_api_with_image_data
        from app.services.hie_service import run_hie
        from app.services.weather_service import get_latest_weather
        from app.models.prediction import Prediction, Priority, DiseaseStatus

        # Step 1: Call AI service using local file bytes
        ai_result = call_ai_api_with_image_data(content)
        
        # Step 2: Get weather data
        weather = get_latest_weather(db)
        temperature = weather.temperature if weather else None
        humidity = weather.humidity if weather else None
        
        # Step 3: Run HIE rule engine
        hie_result = run_hie(
            ripeness=ai_result.get("ripeness", 50),
            fruit_count=ai_result.get("fruit_count", 0),
            disease=ai_result.get("disease", "HEALTHY"),
            confidence=ai_result.get("confidence", 0.5),
            temperature=temperature,
            humidity=humidity,
        )
        
        # Step 4: Save prediction to database
        prediction = Prediction(
            farm_id=farm_id,
            ripeness=ai_result.get("ripeness", 50),
            fruit_count=ai_result.get("fruit_count", 0),
            disease=DiseaseStatus(ai_result.get("disease", "HEALTHY")),
            confidence=ai_result.get("confidence", 0.5),
            recommendation=hie_result.get("recommendation"),
            priority=Priority(hie_result.get("harvest_priority")),
            reason=hie_result.get("reason"),
            harvest_readiness=hie_result.get("harvest_readiness"),
            disease_risk=hie_result.get("disease_risk"),
        )
        db.add(prediction)
        db.commit()
        
        return UploadResponse(
            image_url=image_url,
            image_id=image.id,
            message="Image uploaded and successfully analyzed by AI.",
            ripeness=ai_result.get("ripeness", 50),
            fruit_count=ai_result.get("fruit_count", 0),
            disease=ai_result.get("disease", "HEALTHY"),
            recommendation=hie_result.get("recommendation"),
            priority=hie_result.get("harvest_priority"),
            reason=hie_result.get("reason"),
            harvest_readiness=hie_result.get("harvest_readiness"),
            disease_risk=hie_result.get("disease_risk"),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")