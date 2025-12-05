# SmartBin Setup Guide 🚀

## ✅ Complete Smart Waste Management System

All 8 steps have been successfully implemented!

### 📦 What's Included

1. ✅ **Infrastructure**: PostgreSQL + MQTT (Mosquitto)
2. ✅ **Auth Service** (Port 8001): User management, JWT auth, Points system
3. ✅ **Bin Service** (Port 8002): Bin management, Open/Close via MQTT
4. ✅ **Detection Service** (Port 8003): Material detection, Points allocation
5. ✅ **Reclamation Service** (Port 8004): User complaints/issues
6. ✅ **API Gateway** (Port 8000): Route aggregation (optional)
7. ✅ **Node-RED** (Port 1880): IoT simulation interface
8. ✅ **Frontend** (Port 3000): Modern web dashboard

---

## 🚀 Quick Start

### 1. Start Everything

```bash
./start.sh
```

Or manually:

```bash
docker-compose up -d
```

### 2. Access Services

| Service             | URL                   | Purpose            |
| ------------------- | --------------------- | ------------------ |
| **Frontend**        | http://localhost:3000 | Main web interface |
| **Node-RED**        | http://localhost:1880 | IoT simulator      |
| **Auth API**        | http://localhost:8001 | Authentication     |
| **Bin API**         | http://localhost:8002 | Bin management     |
| **Detection API**   | http://localhost:8003 | Material detection |
| **Reclamation API** | http://localhost:8004 | Complaints         |
| **MQTT**            | mqtt://localhost:1883 | Message broker     |

---

## 📱 Using the Application

### Step 1: Register an Account

1. Open http://localhost:3000
2. Click "Register here"
3. Fill in your details
4. You'll get a QR code (e.g., `SB-xxxxx-xxxx`)

### Step 2: Create a Bin

1. Go to "Bins" page
2. Click "Add Bin"
3. Fill in:
   - Name: e.g., "Kitchen Bin"
   - QR Code: e.g., "BIN-001"
   - Location: e.g., "Building A"
   - Capacity: e.g., 100

### Step 3: Simulate IoT Events with Node-RED

1. Open http://localhost:1880
2. You'll see the SmartBin IoT Simulator flow
3. Set environment variables (optional):
   - Click on a function node (e.g., "Prepare Open Command")
   - Update `BIN_ID` and `USER_QR` with your values
4. Click inject buttons to simulate:
   - **Open Bin**: Simulates QR scan to open bin
   - **Close Bin**: Simulates bin closing
   - **Detect Material**: Simulates material detection (plastic, paper, glass, metal, organic)

### Step 4: Watch Points Accumulate

- Each material detected awards points:
  - Plastic: 15 points
  - Glass: 20 points
  - Metal: 18 points
  - Paper: 10 points
  - Organic: 5 points
- View your points on the Dashboard

### Step 5: Submit Reclamations

1. Go to "Reclamations" page
2. Click "New Reclamation"
3. Report bin issues or technical problems

---

## 🧪 Testing with Postman

Import the Postman collection:

```
SmartBin_Postman_Collection.json
```

The collection includes all API endpoints for:

- Auth Service (Register, Login, Profile)
- Bin Service (CRUD, Open/Close)
- Reclamation Service (CRUD, Status updates)

---

## 🔧 Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth_service
docker-compose logs -f bin_service
docker-compose logs -f detection_service
```

### Stop All Services

```bash
docker-compose down
```

### Rebuild After Changes

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Access Database

```bash
docker exec -it smartbin_postgres psql -U smartbin_user -d smartbin_db
```

### Test MQTT

```bash
# Subscribe to all topics
docker exec -it smartbin_mosquitto mosquitto_sub -h localhost -t 'bin/#' -v

# Publish test message
docker exec -it smartbin_mosquitto mosquitto_pub -h localhost -t 'bin/test/open' -m '{"test":"message"}'
```

---

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │ :3000
│   (Nginx)   │
└─────┬───────┘
      │
      ├──────────────────┬──────────────────┬──────────────────┐
      │                  │                  │                  │
┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│    Auth    │   │     Bin     │   │  Detection  │   │ Reclamation │
│   :8001    │   │    :8002    │   │    :8003    │   │    :8004    │
└─────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
      │                  │                  │                  │
      └─────────┬────────┴──────────┬───────┴──────────────────┘
                │                   │
        ┌───────▼───────┐   ┌───────▼────────┐
        │   PostgreSQL  │   │  MQTT Mosquitto│
        │     :5432     │   │     :1883      │
        └───────────────┘   └────────┬───────┘
                                     │
                            ┌────────▼────────┐
                            │    Node-RED     │
                            │     :1880       │
                            └─────────────────┘
```

---

## 📊 Database Schemas

### Auth Schema

- **users**: User accounts with points and QR codes
- **points_history**: Track all point changes

### Bins Schema

- **bins**: Smart bin information
- **bin_usage_logs**: Track bin open/close events

### Detection Schema

- **material_detections**: Log all detected materials
- **detection_stats**: Aggregated statistics

### Reclamation Schema

- **reclamations**: User complaints and issues
- **reclamation_attachments**: File attachments (optional)

---

## 🔐 Default Credentials

- **Database**: smartbin_user / smartbin_pass
- **MQTT**: Anonymous (no auth in development)

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check service logs
docker-compose logs [service_name]

# Restart specific service
docker-compose restart [service_name]
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Run migrations manually
docker exec -it smartbin_auth python manage.py migrate
```

### MQTT Not Working

```bash
# Check mosquitto logs
docker-compose logs mosquitto

# Test MQTT connection
docker exec -it smartbin_mosquitto mosquitto_sub -t 'bin/#' -v
```

### Frontend Not Loading

```bash
# Check nginx logs
docker-compose logs frontend

# Verify files exist
docker exec -it smartbin_frontend ls -la /usr/share/nginx/html
```

---

## 🎯 Next Steps

1. **Production Deployment**:

   - Update `ALLOWED_HOSTS` in Django settings
   - Enable HTTPS/SSL
   - Configure proper MQTT authentication
   - Set strong database passwords

2. **Enhancements**:

   - Add admin dashboard
   - Implement real QR code scanning (use phone camera)
   - Add email notifications
   - Implement bin fill level sensors
   - Add analytics and reporting

3. **Integration**:
   - Connect real IoT sensors
   - Implement mobile app
   - Add payment gateway for rewards
   - Integrate with waste management systems

---

## 📞 Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test individual services with Postman
4. Review Node-RED flows for simulation

---

## 🎉 Success!

Your SmartBin application is now fully operational!

Start by:

1. Opening http://localhost:3000
2. Registering an account
3. Creating a bin
4. Simulating events in Node-RED
5. Watching your points grow! 🌟
