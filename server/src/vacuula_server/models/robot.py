from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from vacuula_server.db import Base

class Robot(Base):
    __tablename__ = "robot"

    serial: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=True) # only gen2/3 needs a "saved" password
    
    