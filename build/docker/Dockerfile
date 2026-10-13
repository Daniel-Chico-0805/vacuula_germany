# frontend
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend

WORKDIR /app

RUN corepack enable

COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm approve-builds @parcel/watcher
RUN pnpm install --frozen-lockfile

COPY app/ ./

RUN pnpm vite build


FROM python:3.14-slim AS python-build

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf "https://astral.sh/uv/0.12.0/install.sh" \
    | env UV_INSTALL_DIR=/usr/local/bin UV_NO_MODIFY_PATH=1 sh

WORKDIR /server

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --frozen --no-dev --no-editable --no-install-project

COPY server/src ./src

RUN version="$(sed -nE 's/^version = "(.*)"/\1/p' pyproject.toml | head -1)" \
    && printf 'APP_VERSION = "%s"\n' "${version:-0.0.0-dev}" > src/vacuula_server/_build_version.py

RUN uv sync --frozen --no-dev --no-editable


# final server image
FROM python:3.14-slim

WORKDIR /server

# tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl openssl \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/server/.venv/bin:$PATH" PYTHONUNBUFFERED=1

COPY --from=python-build /server/.venv ./.venv

COPY server/ssl/vacuula.cnf ./ssl/vacuula.cnf
COPY server/alembic.ini ./
COPY server/migrations ./migrations

# Built frontend
COPY --from=frontend /app/dist ./web

CMD ["sh", "-c", "alembic upgrade head && vacuula-server"]