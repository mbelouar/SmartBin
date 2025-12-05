# 🧪 SmartBin Infrastructure Testing Guide

## Prerequisites

Before testing, ensure you have:

- ✅ Docker Desktop installed and **running**
- ✅ Docker Compose installed
- ✅ At least 4GB of free RAM
- ✅ Ports available: 5432, 1883, 9001

## Test Phase 1: Infrastructure Only (PostgreSQL + MQTT)

### Step 1: Start Docker Desktop

**macOS**: Open Docker Desktop application from Applications folder

**Verify Docker is running:**

```bash
docker info
```

You should see Docker server information without errors.

### Step 2: Start Infrastructure Services

```bash
cd /Users/mohammedbelouarraq/Desktop/SmartBin

# Start only PostgreSQL and MQTT
docker-compose -f docker-compose.test.yml up -d
```

### Step 3: Check Service Status

```bash
# Check if containers are running
docker-compose -f docker-compose.test.yml ps

# Expected output:
# NAME                        STATUS         PORTS
# smartbin_postgres_test      Up (healthy)   0.0.0.0:5432->5432/tcp
# smartbin_mosquitto_test     Up (healthy)   0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
```

### Step 4: Test PostgreSQL

```bash
# Test database connection
docker exec smartbin_postgres_test psql -U smartbin_user -d smartbin_db -c "SELECT version();"

# List schemas
docker exec smartbin_postgres_test psql -U smartbin_user -d smartbin_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'bins', 'detection', 'reclamation');"
```

**Expected output:**

- PostgreSQL version information
- List of schemas: auth, bins, detection, reclamation

### Step 5: Test MQTT Broker

**Terminal 1 (Subscriber):**

```bash
docker exec -it smartbin_mosquitto_test mosquitto_sub -t "test/smartbin" -v
```

**Terminal 2 (Publisher):**

```bash
docker exec smartbin_mosquitto_test mosquitto_pub -t "test/smartbin" -m "Hello SmartBin!"
```

**Expected:** Terminal 1 should show the message "Hello SmartBin!"

### Step 6: View Logs

```bash
# All services
docker-compose -f docker-compose.test.yml logs -f

# PostgreSQL only
docker-compose -f docker-compose.test.yml logs -f postgres

# MQTT only
docker-compose -f docker-compose.test.yml logs -f mosquitto
```

### Step 7: Python Connectivity Test (Optional)

Install Python dependencies:

```bash
pip install psycopg2-binary paho-mqtt
```

Run test script:

```bash
python test_infrastructure.py
```

### Step 8: Stop Infrastructure

```bash
docker-compose -f docker-compose.test.yml down

# To remove volumes (clean database)
docker-compose -f docker-compose.test.yml down -v
```

---

## Test Phase 2: Full System Test (All Services)

⚠️ **Note:** Complete this AFTER Django services are fully implemented.

### Step 1: Build All Services

```bash
docker-compose build
```

### Step 2: Start All Services

```bash
docker-compose up -d
```

### Step 3: Check All Services

```bash
docker-compose ps

# Expected 9 services:
# - postgres (5432)
# - mosquitto (1883, 9001)
# - auth_service (8001)
# - bin_service (8002)
# - detection_service (8003)
# - reclamation_service (8004)
# - gateway (8000)
# - node_red (1880)
# - frontend (3000)
```

### Step 4: Run Migrations

```bash
docker exec -it smartbin_auth python manage.py migrate
docker exec -it smartbin_bin_service python manage.py migrate
docker exec -it smartbin_detection python manage.py migrate
docker exec -it smartbin_reclamation python manage.py migrate
```

### Step 5: Create Superusers

```bash
docker exec -it smartbin_auth python manage.py createsuperuser
# Enter username, email, password when prompted
```

### Step 6: Access Services

Open in browser:

- 🌐 Frontend: http://localhost:3000
- 🚪 API Gateway: http://localhost:8000
- 🔐 Auth Service: http://localhost:8001/admin
- 🗑️ Bin Service: http://localhost:8002/admin
- 🔍 Detection Service: http://localhost:8003/admin
- 📝 Reclamation Service: http://localhost:8004/admin
- 🎨 Node-RED: http://localhost:1880

### Step 7: Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health/

# Register user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

---

## Troubleshooting

### Docker not running

```bash
# macOS: Start Docker Desktop application
open -a Docker

# Wait for Docker to start (check icon in menu bar)
```

### Port already in use

```bash
# Find process using port
lsof -i :5432  # PostgreSQL
lsof -i :1883  # MQTT
lsof -i :8000  # Gateway

# Kill process if needed
kill -9 <PID>
```

### Container won't start

```bash
# View container logs
docker logs smartbin_postgres_test
docker logs smartbin_mosquitto_test

# Rebuild container
docker-compose -f docker-compose.test.yml build --no-cache
docker-compose -f docker-compose.test.yml up -d
```

### Database connection refused

```bash
# Wait for PostgreSQL to be ready
docker exec smartbin_postgres_test pg_isready -U smartbin_user

# Check PostgreSQL logs
docker logs smartbin_postgres_test
```

### MQTT connection refused

```bash
# Check if Mosquitto is running
docker exec smartbin_mosquitto_test mosquitto_sub -t '$$SYS/#' -C 1

# Check Mosquitto logs
docker logs smartbin_mosquitto_test
```

---

## Success Criteria

### Phase 1 (Infrastructure) ✅

- [ ] PostgreSQL container is running and healthy
- [ ] Database `smartbin_db` exists
- [ ] Schemas (auth, bins, detection, reclamation) are created
- [ ] MQTT broker accepts connections on port 1883
- [ ] MQTT WebSocket available on port 9001
- [ ] Can publish and subscribe to MQTT topics

### Phase 2 (Full System) ✅

- [ ] All 9 containers running
- [ ] All services healthy (check with `docker-compose ps`)
- [ ] Can access all admin panels
- [ ] API endpoints respond correctly
- [ ] MQTT communication between services works
- [ ] Node-RED flows are loaded
- [ ] Frontend loads successfully

---

## Quick Reference

```bash
# Start infrastructure only
docker-compose -f docker-compose.test.yml up -d

# Start full system
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Rebuild a service
docker-compose build [service_name]

# Access container shell
docker exec -it [container_name] /bin/sh

# Clean everything (removes volumes)
docker-compose down -v
docker system prune -a
```
