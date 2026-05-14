from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models.history import SearchSession
from models.user import User
from schemas.history import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_SIZE = 8 * 1024 * 1024


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    device_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail={"code": "UNSUPPORTED_FILE_TYPE", "message": "仅支持 JPG、PNG、WEBP 图片"})

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail={"code": "EMPTY_FILE", "message": "上传文件为空"})
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail={"code": "FILE_TOO_LARGE", "message": "图片不能超过 8MB"})

    settings = get_settings()
    upload_id = f"upl_{uuid4().hex[:12]}"
    suffix = ALLOWED_TYPES[file.content_type]
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{upload_id}{suffix}"
    file_path.write_bytes(content)

    user = None
    if device_id:
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            user = User(device_id=device_id)
            db.add(user)
            db.flush()

    image_url = f"{settings.public_base_url.rstrip('/')}/uploads/{file_path.name}"
    session = SearchSession(user_id=user.id if user else None, upload_id=upload_id, image_url=image_url, status="uploaded")
    db.add(session)
    db.commit()
    db.refresh(session)

    return {"data": UploadResponse(upload_id=upload_id, session_id=session.id, image_url=image_url)}
