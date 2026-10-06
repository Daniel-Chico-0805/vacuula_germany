rm data/vacuula.db
rm migrations/versions/ -r
alembic revision --autogenerate -m "initial"
alembic upgrade head