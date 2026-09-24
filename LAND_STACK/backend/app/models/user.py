
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    CITIZEN = 'citizen'
    OFFICER = 'officer'
    ADMIN = 'admin'


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    applications = relationship('Application', foreign_keys='Application.applicant_id', back_populates='applicant')
    decisions_made = relationship('Application', foreign_keys='Application.decided_by', overlaps="decider", viewonly=True)
    documents_uploaded = relationship('Document', back_populates='user')

    def __repr__(self):
        return f'<User {self.email}>'

