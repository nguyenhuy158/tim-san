SHELL := /bin/bash

APP_PORT ?= 3000
API_PORT ?= 8000
API_BASE_URL ?= http://localhost:$(API_PORT)

PYTHON ?= python3
VENV := backend/.venv
VENV_PYTHON := $(VENV)/bin/python
VENV_PIP := $(VENV)/bin/pip
VENV_UVICORN := $(VENV)/bin/uvicorn

.DEFAULT_GOAL := help

.PHONY: help
help:
	@printf "tim-san commands\n\n"
	@printf "Setup:\n"
	@printf "  make setup          Install frontend and backend dependencies\n"
	@printf "  make install        Install frontend dependencies with pnpm install\n"
	@printf "  make backend-setup  Create backend venv and install requirements\n\n"
	@printf "Development:\n"
	@printf "  make dev            Run frontend with NEXT_PUBLIC_API_BASE_URL\n"
	@printf "  make frontend-dev   Same as make dev\n"
	@printf "  make backend-dev    Run FastAPI backend on API_PORT=$(API_PORT)\n"
	@printf "  make dev-all        Run frontend and backend together\n"
	@printf "  make backend-health Check backend health endpoint\n\n"
	@printf "Build/check:\n"
	@printf "  make build          Build frontend\n"
	@printf "  make start          Start built frontend\n"
	@printf "  make lint           Run eslint\n"
	@printf "  make test           Build and run tests\n"
	@printf "  make check          Run lint and test\n"
	@printf "  make db-generate    Generate Drizzle migrations\n\n"
	@printf "Cleanup:\n"
	@printf "  make clean          Remove generated build/cache artifacts\n"
	@printf "  make clean-all      Remove artifacts, node_modules, backend venv\n"

.PHONY: install
install:
	pnpm install

.PHONY: backend-setup
backend-setup:
	$(PYTHON) -m venv $(VENV)
	$(VENV_PIP) install --upgrade pip
	$(VENV_PIP) install -r backend/requirements.txt

.PHONY: setup
setup: install backend-setup

.PHONY: dev frontend-dev
dev frontend-dev:
	NEXT_PUBLIC_API_BASE_URL=$(API_BASE_URL) pnpm run dev

.PHONY: backend-dev
backend-dev: backend-setup
	cd backend && .venv/bin/uvicorn main:app --reload --port $(API_PORT)

.PHONY: dev-all
dev-all: backend-setup
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && .venv/bin/uvicorn main:app --reload --port $(API_PORT)) & \
	NEXT_PUBLIC_API_BASE_URL=$(API_BASE_URL) pnpm run dev & \
	wait

.PHONY: backend-health
backend-health:
	curl -fsS $(API_BASE_URL)/api/health
	@printf "\n"

.PHONY: build
build:
	pnpm run build

.PHONY: start
start:
	NEXT_PUBLIC_API_BASE_URL=$(API_BASE_URL) pnpm run start

.PHONY: lint
lint:
	pnpm run lint

.PHONY: test
test:
	pnpm test

.PHONY: check
check: lint test

.PHONY: db-generate
db-generate:
	pnpm run db:generate

.PHONY: clean
clean:
	rm -rf .next .vinext dist .wrangler outputs work coverage

.PHONY: clean-all
clean-all: clean
	rm -rf node_modules $(VENV)
