# from flask_sqlalchemy import SQLAlchemy

# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
# db = SQLAlchemy()

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from contextlib import contextmanager

import typing
if typing.TYPE_CHECKING:
    from handlers.router import RouterHandler

engine = create_engine(
    "sqlite:///vacuula.db",
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
