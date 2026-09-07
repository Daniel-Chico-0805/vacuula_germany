import time

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from db import Base

class Robot(Base):
    __tablename__ = "robot"

    serial: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=True) # only gen2/3 needs a "saved" password
    
    