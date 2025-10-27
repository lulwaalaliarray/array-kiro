# PatientCare Development Makefile

.PHONY: help install dev build test lint format clean docker-dev docker-prod

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install dependencies for all projects"
	@echo "  dev         - Start development servers"
	@echo "  build       - Build all projects for production"
	@echo "  test        - Run tests for all projects"
	@echo "  lint        - Run linting for all projects"
	@echo "  format      - Format code for all projects"
	@echo "  clean       - Clean build artifacts and node_modules"
	@echo "  docker-dev  - Start development environment with Docker"
	@echo "  docker-prod - Start production environment with Docker"

# Install dependencies
install:
	npm run install:all

# Start development servers
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run tests
test:
	npm run test:backend
	npm run test:frontend

# Run linting
lint:
	npm run lint

# Format code
format:
	npm run format

# Clean build artifacts
clean:
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf backend/dist
	rm -rf frontend/node_modules
	rm -rf frontend/dist

# Docker development
docker-dev:
	docker-compose up --build

# Docker production
docker-prod:
	docker-compose -f docker-compose.prod.yml up --build -d

# Stop Docker containers
docker-stop:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

# Database operations
db-generate:
	cd backend && npm run db:generate

db-migrate:
	cd backend && npm run db:migrate

db-studio:
	cd backend && npm run db:studio