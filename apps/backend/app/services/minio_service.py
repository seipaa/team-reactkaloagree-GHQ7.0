"""MinIO service for S3-compatible object storage."""
import os
import uuid
from typing import Optional
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.config import settings

# Global MinIO client (lazy initialization)
_minio_client: Optional[Minio] = None


def get_client() -> Minio:
    """Get or create MinIO client."""
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
    return _minio_client


def ensure_bucket_exists():
    """Ensure the bucket exists, create if not."""
    client = get_client()
    try:
        if not client.bucket_exists(settings.minio_bucket):
            client.make_bucket(settings.minio_bucket)
    except S3Error as e:
        print(f"Error ensuring bucket exists: {e}")


def upload_image(file_content: bytes, filename: str, farm_id: int) -> str:
    """
    Upload an image to MinIO.
    Returns the public URL of the uploaded image.
    """
    client = get_client()
    ensure_bucket_exists()

    # Generate unique object name
    ext = os.path.splitext(filename)[1] or ".jpg"
    object_name = f"farms/{farm_id}/{uuid.uuid4()}{ext}"

    # Determine content type
    content_type = "image/jpeg"
    if ext.lower() in [".png"]:
        content_type = "image/png"
    elif ext.lower() in [".jpg", ".jpeg"]:
        content_type = "image/jpeg"
    elif ext.lower() in [".webp"]:
        content_type = "image/webp"

    import io
    try:
        # Upload the file
        client.put_object(
            bucket_name=settings.minio_bucket,
            object_name=object_name,
            data=io.BytesIO(file_content),
            length=len(file_content),
            content_type=content_type,
        )

        # Generate public URL (relative for the frontend, handled via Nginx reverse proxy)
        url = f"/agromesh-images/{object_name}"
        return url, object_name
    except S3Error as e:
        print(f"Error uploading image: {e}")
        raise


def get_image_url(object_name: str, expires: int = 3600) -> str:
    """Generate a presigned URL for an image."""
    client = get_client()
    try:
        url = client.presigned_get_object(
            bucket_name=settings.minio_bucket,
            object_name=object_name,
            expires=timedelta(seconds=expires),
        )
        return url
    except S3Error as e:
        print(f"Error generating presigned URL: {e}")
        raise


def delete_image(object_name: str) -> None:
    """Delete an image from MinIO."""
    client = get_client()
    try:
        client.remove_object(
            bucket_name=settings.minio_bucket,
            object_name=object_name,
        )
    except S3Error as e:
        print(f"Error deleting image: {e}")