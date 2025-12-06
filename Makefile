# SmartBin Makefile
# Easy commands to manage the application

.PHONY: help start stop restart status logs clean build test setup admin

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(GREEN)SmartBin - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(BLUE)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Application Management

start: ## Start all services
	@echo "$(GREEN)🚀 Starting SmartBin Application...$(NC)"
	@docker-compose up -d postgres mosquitto
	@echo "$(YELLOW)⏳ Waiting for infrastructure (10s)...$(NC)"
	@sleep 10
	@docker-compose up -d auth_service bin_service detection_service reclamation_service
	@echo "$(YELLOW)⏳ Waiting for microservices (15s)...$(NC)"
	@sleep 15
	@docker-compose up -d frontend node_red
	@echo ""
	@echo "$(GREEN)✅ SmartBin is now running!$(NC)"
	@echo ""
	@make urls

stop: ## Stop all services
	@echo "$(RED)🛑 Stopping all services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ All services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting SmartBin...$(NC)"
	@make stop
	@sleep 2
	@make start

status: ## Show status of all services
	@echo "$(BLUE)📊 Service Status:$(NC)"
	@docker-compose ps

logs: ## Show logs of all services (use 'make logs-<service>' for specific service)
	@docker-compose logs -f

logs-auth: ## Show auth service logs
	@docker-compose logs -f auth_service

logs-bin: ## Show bin service logs
	@docker-compose logs -f bin_service

logs-detection: ## Show detection service logs
	@docker-compose logs -f detection_service

logs-reclamation: ## Show reclamation service logs
	@docker-compose logs -f reclamation_service

logs-gateway: ## Show gateway logs
	@docker-compose logs -f gateway

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-nodered: ## Show Node-RED logs
	@docker-compose logs -f node_red

##@ Infrastructure

infra-start: ## Start only infrastructure (PostgreSQL + MQTT)
	@echo "$(GREEN)🏗️  Starting infrastructure...$(NC)"
	@docker-compose up -d postgres mosquitto
	@echo "$(GREEN)✅ Infrastructure started$(NC)"

infra-stop: ## Stop infrastructure
	@docker-compose stop postgres mosquitto

##@ Service Management

service-restart: ## Restart a specific service (usage: make service-restart SERVICE=auth_service)
	@docker-compose restart $(SERVICE)
	@echo "$(GREEN)✅ Service $(SERVICE) restarted$(NC)"

service-logs: ## Show logs for a specific service (usage: make service-logs SERVICE=auth_service)
	@docker-compose logs -f $(SERVICE)

##@ Build & Development

build: ## Build all services
	@echo "$(BLUE)🔨 Building all services...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✅ Build complete$(NC)"

build-nocache: ## Build all services without cache
	@echo "$(BLUE)🔨 Building all services (no cache)...$(NC)"
	@docker-compose build --no-cache
	@echo "$(GREEN)✅ Build complete$(NC)"

rebuild: ## Rebuild and restart all services
	@make build
	@make restart

##@ Database & Migrations

migrate: ## Run migrations for all services
	@echo "$(BLUE)📦 Running migrations...$(NC)"
	@docker exec -it smartbin_auth python manage.py migrate
	@docker exec -it smartbin_bin_service python manage.py migrate
	@docker exec -it smartbin_detection python manage.py migrate
	@docker exec -it smartbin_reclamation python manage.py migrate
	@echo "$(GREEN)✅ Migrations complete$(NC)"

makemigrations: ## Create new migrations
	@echo "$(BLUE)📦 Creating migrations...$(NC)"
	@docker exec -it smartbin_auth python manage.py makemigrations
	@docker exec -it smartbin_bin_service python manage.py makemigrations
	@docker exec -it smartbin_detection python manage.py makemigrations
	@docker exec -it smartbin_reclamation python manage.py makemigrations
	@echo "$(GREEN)✅ Migrations created$(NC)"

db-shell: ## Access PostgreSQL shell
	@docker exec -it smartbin_postgres psql -U smartbin_user -d smartbin_db

##@ Admin

admin: ## Create superuser for bin service admin panel
	@echo "$(BLUE)👤 Creating superuser for Bin Service Admin Panel$(NC)"
	@echo "$(YELLOW)Access admin at: http://localhost:8002/admin/$(NC)"
	@docker exec -it smartbin_bin_service python manage.py createsuperuser

admin-auth: ## Create superuser for auth service
	@docker exec -it smartbin_auth python manage.py createsuperuser

##@ Testing

test: ## Run tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	@docker exec -it smartbin_auth python manage.py test
	@docker exec -it smartbin_bin_service python manage.py test
	@docker exec -it smartbin_detection python manage.py test
	@docker exec -it smartbin_reclamation python manage.py test

health: ## Check health of all services
	@echo "$(BLUE)🏥 Health Check:$(NC)"
	@echo -n "Auth Service:        "
	@curl -s http://localhost:8001/api/auth/health/ | grep -q "healthy" && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"
	@echo -n "Bin Service:         "
	@curl -s http://localhost:8002/api/bins/health/ | grep -q "healthy" && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"
	@echo -n "Detection Service:   "
	@curl -s http://localhost:8003/api/detections/health/ | grep -q "healthy" && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"
	@echo -n "Reclamation Service: "
	@curl -s http://localhost:8004/api/reclamations/health/ | grep -q "healthy" && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"
	@echo -n "Frontend:            "
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"
	@echo -n "Node-RED:            "
	@curl -s http://localhost:1880 > /dev/null && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ FAILED$(NC)"

##@ Cleanup

clean: ## Stop and remove all containers, networks, and volumes
	@echo "$(RED)🧹 Cleaning up...$(NC)"
	@docker-compose down -v
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

clean-all: ## Remove everything including images
	@echo "$(RED)🧹 Deep cleaning (removing images)...$(NC)"
	@docker-compose down -v --rmi all
	@echo "$(GREEN)✅ Deep cleanup complete$(NC)"

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)🧹 Pruning Docker resources...$(NC)"
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)✅ Prune complete$(NC)"

##@ Information

urls: ## Display all service URLs
	@echo "$(BLUE)📊 Service URLs:$(NC)"
	@echo "  $(GREEN)Frontend:          $(NC) http://localhost:3000"
	@echo "  $(GREEN)Node-RED:          $(NC) http://localhost:1880"
	@echo "  $(GREEN)Auth Service:      $(NC) http://localhost:8001"
	@echo "  $(GREEN)Bin Service:       $(NC) http://localhost:8002"
	@echo "  $(GREEN)Detection Service: $(NC) http://localhost:8003"
	@echo "  $(GREEN)Reclamation Service:$(NC) http://localhost:8004"
	@echo "  $(GREEN)API Gateway:       $(NC) http://localhost:8000"
	@echo "  $(GREEN)MQTT Broker:       $(NC) mqtt://localhost:1883"
	@echo "  $(GREEN)PostgreSQL:        $(NC) localhost:5432"
	@echo ""
	@echo "$(YELLOW)📝 Admin Panels:$(NC)"
	@echo "  $(GREEN)pgAdmin (Database): $(NC) http://localhost:5050"
	@echo "  $(GREEN)Bin Admin:         $(NC) http://localhost:8002/admin/"
	@echo "  $(GREEN)Auth Admin:        $(NC) http://localhost:8001/admin/"
	@echo ""

info: ## Show detailed information
	@echo "$(BLUE)ℹ️  SmartBin Information$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Images:$(NC)"
	@docker images | grep smartbin
	@echo ""
	@echo "$(YELLOW)Volumes:$(NC)"
	@docker volume ls | grep smartbin
	@echo ""
	@echo "$(YELLOW)Networks:$(NC)"
	@docker network ls | grep smartbin
	@echo ""

##@ Quick Actions

dev: ## Start in development mode with logs
	@make start
	@make logs

quick: ## Quick start (infrastructure + services only, no frontend)
	@docker-compose up -d postgres mosquitto auth_service bin_service detection_service reclamation_service
	@echo "$(GREEN)✅ Core services started$(NC)"
	@make urls

shell-auth: ## Open shell in auth service container
	@docker exec -it smartbin_auth /bin/sh

shell-bin: ## Open shell in bin service container
	@docker exec -it smartbin_bin_service /bin/sh

shell-db: ## Open shell in PostgreSQL container
	@docker exec -it smartbin_postgres /bin/sh

##@ Setup

setup: ## Initial setup (build, start, migrate)
	@echo "$(BLUE)🔧 Initial Setup$(NC)"
	@make build
	@make start
	@echo "$(YELLOW)⏳ Waiting for services to be ready...$(NC)"
	@sleep 10
	@make migrate
	@echo ""
	@echo "$(GREEN)✅ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)📝 Next steps:$(NC)"
	@echo "  1. Create admin user: $(BLUE)make admin$(NC)"
	@echo "  2. Open frontend: $(BLUE)http://localhost:3000$(NC)"
	@echo "  3. Add bins via admin: $(BLUE)http://localhost:8002/admin/$(NC)"
	@echo ""

##@ MQTT

mqtt-sub: ## Subscribe to all MQTT topics
	@echo "$(BLUE)📡 Subscribing to MQTT topics (Ctrl+C to stop)$(NC)"
	@docker exec -it smartbin_mosquitto mosquitto_sub -h localhost -t 'bin/#' -v

mqtt-test: ## Publish test MQTT message
	@echo "$(BLUE)📡 Publishing test message$(NC)"
	@docker exec -it smartbin_mosquitto mosquitto_pub -h localhost -t 'bin/test/detected' -m '{"test":"message","timestamp":"2024-01-01T00:00:00Z"}'
	@echo "$(GREEN)✅ Test message published$(NC)"

##@ Backup & Restore

backup: ## Backup database
	@echo "$(BLUE)💾 Creating database backup...$(NC)"
	@mkdir -p backups
	@docker exec smartbin_postgres pg_dump -U smartbin_user smartbin_db > backups/smartbin_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup created in backups/$(NC)"

restore: ## Restore database (usage: make restore FILE=backups/smartbin_backup_XXXXXX.sql)
	@echo "$(YELLOW)⚠️  Restoring database from $(FILE)$(NC)"
	@docker exec -i smartbin_postgres psql -U smartbin_user smartbin_db < $(FILE)
	@echo "$(GREEN)✅ Database restored$(NC)"

##@ Troubleshooting

fix-permissions: ## Fix file permissions
	@echo "$(BLUE)🔧 Fixing permissions...$(NC)"
	@chmod +x start.sh
	@chmod 644 docker-compose.yml
	@echo "$(GREEN)✅ Permissions fixed$(NC)"

reset: ## Complete reset (stop, clean, rebuild, start)
	@echo "$(RED)⚠️  This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		make clean-all; \
		make setup; \
	fi

diagnose: ## Run diagnostics
	@echo "$(BLUE)🔍 Running diagnostics...$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Status:$(NC)"
	@docker info > /dev/null 2>&1 && echo "$(GREEN)✅ Docker is running$(NC)" || echo "$(RED)❌ Docker is not running$(NC)"
	@echo ""
	@echo "$(YELLOW)Container Status:$(NC)"
	@make status
	@echo ""
	@echo "$(YELLOW)Health Checks:$(NC)"
	@make health
	@echo ""
	@echo "$(YELLOW)Disk Usage:$(NC)"
	@docker system df

verify-db: ## Verify database contains users and data
	@./verify_database.sh
