from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class SearchSession(Base):
    __tablename__ = "search_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    upload_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    image_url: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    recognized_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="sessions")
    recognized_items = relationship("RecognizedItem", back_populates="session", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="session", cascade="all, delete-orphan")


class RecognizedItem(Base):
    __tablename__ = "recognized_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("search_sessions.id"), index=True)
    category: Mapped[str] = mapped_column(String(128))
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    style: Mapped[str | None] = mapped_column(String(128), nullable=True)
    material: Mapped[str | None] = mapped_column(String(128), nullable=True)
    keywords: Mapped[list[str]] = mapped_column(MutableList.as_mutable(JSONB), default=list)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    raw_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session = relationship("SearchSession", back_populates="recognized_items")
