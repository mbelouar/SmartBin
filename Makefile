# SmartBin Makefile - Minimal Essential Commands

.PHONY: help start stop restart status logs build migrate clean admin urls build-frontend build-push push-all tag-all push-images start-prod pull-images

# Docker Hub Configuration
# Set your Docker Hub username: make push-all DOCKERHUB_USER=yourusername
# Or export it: export DOCKERHUB_USER=yourusername
DOCKERHUB_USER ?= $(shell echo $$DOCKERHUB_USER)
VERSION ?= latest

# Colors
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

.DEFAULT_GOAL := help

help: ## Show available commands
	@echo "$(GREEN)SmartBin - Essential Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}'

start: ## Start all services
	@echo "$(GREEN)🚀 Starting SmartBin...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Services started$(NC)"
	@make urls

stop: ## Stop all services
	@echo "$(GREEN)🛑 Stopping services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✅ Services restarted$(NC)"

status: ## Show service status
	@docker-compose ps

logs: ## Show logs (use: make logs SERVICE=frontend)
	@docker-compose logs -f $(SERVICE)

build: ## Build all services
	@echo "$(BLUE)🔨 Building services...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✅ Build complete$(NC)"

migrate: ## Run database migrations
	@echo "$(BLUE)📦 Running migrations...$(NC)"
	@docker-compose exec auth_service python manage.py migrate
	@docker-compose exec bin_service python manage.py migrate
	@docker-compose exec detection_service python manage.py migrate
	@docker-compose exec reclamation_service python manage.py migrate
	@echo "$(GREEN)✅ Migrations complete$(NC)"

admin: ## Create admin user
	@echo "$(BLUE)👤 Creating admin user...$(NC)"
	@docker-compose exec bin_service python manage.py createsuperuser

clean: ## Stop and remove all containers/volumes
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	@docker-compose down -v
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

urls: ## Show service URLs
	@echo "$(BLUE)📊 Service URLs:$(NC)"
	@echo "  $(GREEN)Frontend:          $(NC) http://localhost:3000"
	@echo "  $(GREEN)Node-RED:          $(NC) http://localhost:1880"
	@echo "  $(GREEN)API Gateway:       $(NC) http://localhost:8000"
	@echo "  $(GREEN)phpMyAdmin:         $(NC) http://localhost:8080"
	@echo ""

# Docker Hub Push Commands
build-frontend: ## Build frontend image separately
	@echo "$(BLUE)🔨 Building frontend image...$(NC)"
	@if [ -f frontend/.env.local ]; then \
		CLERK_KEY=$$(grep NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY frontend/.env.local | cut -d '=' -f2); \
		AUTH_URL=$$(grep NEXT_PUBLIC_AUTH_SERVICE_URL frontend/.env.local | cut -d '=' -f2); \
		BIN_URL=$$(grep NEXT_PUBLIC_BIN_SERVICE_URL frontend/.env.local | cut -d '=' -f2); \
		DETECTION_URL=$$(grep NEXT_PUBLIC_DETECTION_SERVICE_URL frontend/.env.local | cut -d '=' -f2); \
		RECLAMATION_URL=$$(grep NEXT_PUBLIC_RECLAMATION_SERVICE_URL frontend/.env.local | cut -d '=' -f2); \
		docker build \
			--build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$$CLERK_KEY" \
			--build-arg NEXT_PUBLIC_AUTH_SERVICE_URL="$$AUTH_URL" \
			--build-arg NEXT_PUBLIC_BIN_SERVICE_URL="$$BIN_URL" \
			--build-arg NEXT_PUBLIC_DETECTION_SERVICE_URL="$$DETECTION_URL" \
			--build-arg NEXT_PUBLIC_RECLAMATION_SERVICE_URL="$$RECLAMATION_URL" \
			-t smartbin-frontend -f frontend/Dockerfile frontend/; \
	else \
		echo "$(YELLOW)⚠️  frontend/.env.local not found, using defaults$(NC)"; \
		docker build -t smartbin-frontend -f frontend/Dockerfile frontend/; \
	fi
	@echo "$(GREEN)✅ Frontend image built$(NC)"

tag-all: ## Tag all images for Docker Hub (requires DOCKERHUB_USER)
	@if [ -z "$(DOCKERHUB_USER)" ]; then \
		echo "$(RED)❌ Error: DOCKERHUB_USER is not set$(NC)"; \
		echo "$(YELLOW)Usage: make tag-all DOCKERHUB_USER=yourusername$(NC)"; \
		echo "$(YELLOW)Or export: export DOCKERHUB_USER=yourusername$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)🏷️  Tagging images for Docker Hub...$(NC)"
	@docker tag smartbin-auth_service $(DOCKERHUB_USER)/smartbin-auth-service:$(VERSION) || echo "$(YELLOW)⚠️  auth_service not found, skipping...$(NC)"
	@docker tag smartbin-bin_service $(DOCKERHUB_USER)/smartbin-bin-service:$(VERSION) || echo "$(YELLOW)⚠️  bin_service not found, skipping...$(NC)"
	@docker tag smartbin-detection_service $(DOCKERHUB_USER)/smartbin-detection-service:$(VERSION) || echo "$(YELLOW)⚠️  detection_service not found, skipping...$(NC)"
	@docker tag smartbin-reclamation_service $(DOCKERHUB_USER)/smartbin-reclamation-service:$(VERSION) || echo "$(YELLOW)⚠️  reclamation_service not found, skipping...$(NC)"
	@docker tag smartbin-gateway $(DOCKERHUB_USER)/smartbin-gateway:$(VERSION) || echo "$(YELLOW)⚠️  gateway not found, skipping...$(NC)"
	@docker tag smartbin-node_red $(DOCKERHUB_USER)/smartbin-node-red:$(VERSION) || echo "$(YELLOW)⚠️  node_red not found, skipping...$(NC)"
	@docker tag smartbin-frontend $(DOCKERHUB_USER)/smartbin-frontend:$(VERSION) || echo "$(YELLOW)⚠️  frontend not found, skipping...$(NC)"
	@echo "$(GREEN)✅ All images tagged$(NC)"

push-images: tag-all ## Push all images to Docker Hub (requires DOCKERHUB_USER)
	@if [ -z "$(DOCKERHUB_USER)" ]; then \
		echo "$(RED)❌ Error: DOCKERHUB_USER is not set$(NC)"; \
		echo "$(YELLOW)Usage: make push-images DOCKERHUB_USER=yourusername$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)📤 Pushing images to Docker Hub...$(NC)"
	@echo "$(YELLOW)Make sure you're logged in: docker login$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-auth-service:$(VERSION) || echo "$(RED)❌ Failed to push auth-service$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-bin-service:$(VERSION) || echo "$(RED)❌ Failed to push bin-service$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-detection-service:$(VERSION) || echo "$(RED)❌ Failed to push detection-service$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-reclamation-service:$(VERSION) || echo "$(RED)❌ Failed to push reclamation-service$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-gateway:$(VERSION) || echo "$(RED)❌ Failed to push gateway$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-node-red:$(VERSION) || echo "$(RED)❌ Failed to push node-red$(NC)"
	@docker push $(DOCKERHUB_USER)/smartbin-frontend:$(VERSION) || echo "$(RED)❌ Failed to push frontend$(NC)"
	@echo "$(GREEN)✅ All images pushed to Docker Hub$(NC)"
	@echo "$(BLUE)📦 Images available at:$(NC)"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-auth-service"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-bin-service"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-detection-service"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-reclamation-service"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-gateway"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-node-red"
	@echo "  https://hub.docker.com/r/$(DOCKERHUB_USER)/smartbin-frontend"

build-push: build build-frontend push-images ## Build and push all images to Docker Hub

push-all: build build-frontend push-images ## Build, tag, and push all images (one command)
	@echo "$(GREEN)✅ All done! Your images are on Docker Hub.$(NC)"

# Production Deployment Commands
pull-images: ## Pull all images from Docker Hub
	@echo "$(BLUE)📥 Pulling images from Docker Hub...$(NC)"
	@docker pull mbelouar/smartbin-auth-service:latest
	@docker pull mbelouar/smartbin-bin-service:latest
	@docker pull mbelouar/smartbin-detection-service:latest
	@docker pull mbelouar/smartbin-reclamation-service:latest
	@docker pull mbelouar/smartbin-gateway:latest
	@docker pull mbelouar/smartbin-node-red:latest
	@docker pull mbelouar/smartbin-frontend:latest
	@echo "$(GREEN)✅ All images pulled$(NC)"

start-prod: pull-images ## Start all services using Docker Hub images (production)
	@echo "$(GREEN)🚀 Starting SmartBin (Production Mode)...$(NC)"
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Services started$(NC)"
	@echo "$(YELLOW)⚠️  Don't forget to run migrations: make migrate-prod$(NC)"
	@make urls

migrate-prod: ## Run database migrations (production)
	@echo "$(BLUE)📦 Running migrations...$(NC)"
	@docker-compose -f docker-compose.prod.yml exec auth_service python manage.py migrate
	@docker-compose -f docker-compose.prod.yml exec bin_service python manage.py migrate
	@docker-compose -f docker-compose.prod.yml exec detection_service python manage.py migrate
	@docker-compose -f docker-compose.prod.yml exec reclamation_service python manage.py migrate
	@echo "$(GREEN)✅ Migrations complete$(NC)"

stop-prod: ## Stop production services
	@echo "$(GREEN)🛑 Stopping production services...$(NC)"
	@docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✅ Services stopped$(NC)"
