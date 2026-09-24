from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine
from app.models import User, Parcel, OwnershipROR, Registration, TaxRecord, Encumbrance, Application, ApplicationStatusHistory, Anomaly, Document

def init_db():
    Base.metadata.create_all(bind=engine)
    print("SQLite database tables initialized successfully!")

if __name__ == "__main__":
    init_db()
