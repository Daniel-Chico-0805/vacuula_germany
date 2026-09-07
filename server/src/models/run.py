import time

from datetime import datetime
from typing import Optional, Any

from sqlalchemy import String, Integer, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class Run(Base):
    __tablename__ = "run"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    robot: Mapped[str] = mapped_column(String, ForeignKey("robot.serial", ondelete='CASCADE'), nullable=False)
    persistent_map: Mapped[str] = mapped_column(String, ForeignKey("persistent_map.id", ondelete='CASCADE'), nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False) # incomplete, complete, canceled?
    launched_from: Mapped[str] = mapped_column(String, nullable=False) # app, schedule, robot?
    error: Mapped[str] = mapped_column(String, nullable=True)

    category: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[int] = mapped_column(Integer, nullable=False)
    navigation_mode: Mapped[int] = mapped_column(Integer, nullable=False)

    start_at: Mapped[int] = mapped_column(Integer, nullable=False)
    end_at: Mapped[int] = mapped_column(Integer, nullable=False)
    charge_at_start: Mapped[int] = mapped_column(Integer, nullable=False)
    charge_at_end: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaned_area: Mapped[float] = mapped_column(Float, nullable=False)



class Gen4__Run(Base):
    __tablename__ = "gen4__run"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    robot: Mapped[str] = mapped_column(String, ForeignKey("robot.serial", ondelete='CASCADE'), nullable=False)
    floorplan: Mapped[str] = mapped_column(String, ForeignKey("gen4__floor_plan.id", ondelete='CASCADE'), nullable=True)

    started_by: Mapped[str] = mapped_column(String, nullable=False) # app, schedule, robot?
    battery_consumed: Mapped[int] = mapped_column(Integer, nullable=False)
    # error: Mapped[str] = mapped_column(String, nullable=True)

    cleaning_complete: Mapped[bool] = mapped_column(Boolean, nullable=False)
    timing: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    runs: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    # category: Mapped[int] = mapped_column(Integer, nullable=False)
    # mode: Mapped[int] = mapped_column(Integer, nullable=False)
    # navigation_mode: Mapped[int] = mapped_column(Integer, nullable=False)

    # start_at: Mapped[int] = mapped_column(Integer, nullable=False)
    # end_at: Mapped[int] = mapped_column(Integer, nullable=False)
    # charge_at_start: Mapped[int] = mapped_column(Integer, nullable=False)
    # charge_at_end: Mapped[int] = mapped_column(Integer, nullable=False)
    # cleaned_area: Mapped[float] = mapped_column(Float, nullable=False)
