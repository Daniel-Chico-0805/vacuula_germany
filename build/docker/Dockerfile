# frontend
FROM node:22-alpine AS frontend

WORKDIR /app

RUN corepack enable

COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm approve-builds @parcel/watcher
RUN pnpm install --frozen-lockfile

COPY app/ ./

RUN pnpm vite build


# python dependencies
FROM python:3.14-slim AS python-deps

WORKDIR /server

RUN pip install --no-cache-dir --upgrade pip

COPY server/requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt


# final server image
FROM python:3.14-slim

WORKDIR /server

# tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl openssl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY --from=python-deps /usr/local/lib/python3.14/site-packages \
    /usr/local/lib/python3.14/site-packages

COPY --from=python-deps /usr/local/bin \
    /usr/local/bin

# Server code
COPY server/src ./src
COPY server/data/ssl/vacuula.cnf ./data/ssl/vacuula.cnf
COPY server/alembic.ini ./
COPY server/migrations ./migrations

# Built frontend
COPY --from=frontend /app/dist ./web

CMD ["sh", "-c", "alembic upgrade head && python -u src/main.py"]