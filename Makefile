# SmartBin Makefile - Minimal Essential Commands

.PHONY: help start stop restart status logs build migrate clean admin urls

# Colors
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
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
