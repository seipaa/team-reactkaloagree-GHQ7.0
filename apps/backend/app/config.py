"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "AgroMesh AI"
    app_version: str = "1.0.0"
    debug: bool = True

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Database
    database_url: str = "sqlite:///./agromesh.db"

    # MinIO / S3 Storage
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "agromesh-images"
    minio_secure: bool = False

    # AI Service
    ai_api_url: str = "http://localhost:8001/predict"
    ai_api_key: str = ""

    # Roboflow AI Service
    roboflow_api_url: str = "https://serverless.roboflow.com"
    roboflow_api_key: str = "f3P0JQQEV0oXN96J9oud"
    
    # Model 1: Chili Maturity & Condition (Disease Detection)
    roboflow_model_1_id: str = "chili-maturity-and-condition-datasets/3"
    roboflow_workspace_1: str = "university-of-southeastern-philippines-cnl9c"
    
    # Model 2: Pepper Fruit Counting
    roboflow_model_2_id: str = "pepper-ydxzo/4"
    roboflow_workspace_2: str = "smartfram"
    
    # Model 3: Health Classification
    roboflow_model_3_id: str = "mongkol4/1"
    roboflow_workspace_3: str = "mongkol-kj0cr"

    # BMKG API
    bmkg_api_url: str = "https://api.bmkg.go.id"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:8080"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()