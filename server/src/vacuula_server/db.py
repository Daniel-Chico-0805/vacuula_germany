from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from contextlib import contextmanager

import typing

from vacuula_server.constants import DB_PATH
if typing.TYPE_CHECKING:
    from vacuula_server.handlers.router import RouterHandler


DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    echo=False
)

SessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=Session
)

@contextmanager
def get_session() -> typing.Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def db_commit2(session: Session, *instances):
    try:
        for instance in instances:
            session.add(instance)
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        # TODO: logger.exception("DB commit failed")
        # req.send_internal_error()
        return False

def db_commit(session: Session, req: RouterHandler, *instances):
    try:
        for instance in instances:
            session.add(instance)
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        # TODO: logger.exception("DB commit failed")
        req.send_internal_error()
        return False

class Base(DeclarativeBase):
    pass
