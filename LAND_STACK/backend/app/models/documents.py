from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    parcel_ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String, nullable=False)  # SaleDeed, MutationOrder, NOC, etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    parcel = relationship("Parcel", back_populates="documents")
    user = relationship("User")