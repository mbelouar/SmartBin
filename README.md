# 🗑️ SmartBin - Intelligent Waste Management System

A microservices-based smart trash management system that rewards users for proper waste disposal.

## 🎯 Features

- **QR Code Scanning**: Users scan QR codes on bins to open them
- **Automatic Bin Control**: Bins open/close via Node-RED simulation
- **Material Detection**: AI-powered detection of trash materials (paper, plastic, glass, other)
- **Points Reward System**: Users earn points for proper waste disposal
- **Reclamations**: Users can submit complaints about bins
- **Real-time Communication**: MQTT-based messaging between services
- **Microservices Architecture**: Scalable Django-based services

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (Port 3000)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (Port 8000)
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   Auth   │   │   Bin    │   │Detection │   │Reclamation│   │PostgreSQL│
│ Service  │   │ Service  │   │ Service  │   │  Service  │   │          │
│ (8001)   │   │ (8002)   │   │ (8003)   │   │  (8004)   │   │ (5432)   │
└──────────┘   └────┬─────┘   └────┬─────┘   └──────────┘   └──────────┘
                    │              │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │   Mosquitto  │
                    │  MQTT Broker │
                    │    (1883)    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Node-RED   │
                    │    (1880)    │
                    └──────────────┘
```

## 📋 Services

1. **Auth Service** (Port 8001)

   - User registration and authentication
   - JWT token management
   - Points tracking

2. **Bin Service** (Port 8002)

   - Bin management (CRUD)
   - Open/close bin operations
   - MQTT publisher for bin commands

3. **Detection Service** (Port 8003)

   - Material detection logging
   - MQTT subscriber for detection events
   - Points allocation to users

4. **Reclamation Service** (Port 8004)

   - User complaint management
   - CRUD operations for reclamations

5. **API Gateway** (Port 8000)

   - Routes all frontend requests
   - Service orchestration
   - Single entry point

6. **Node-RED** (Port 1880)
   - Bin operation simulation
   - Material detection simulation
   - MQTT integration

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SmartBin
   ```

2. **Build and start all services**

   ```bash
   docker-compose up --build
   ```

3. **Access the services**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8000
   - Node-RED: http://localhost:1880
   - Auth Service: http://localhost:8001
   - Bin Service: http://localhost:8002
   - Detection Service: http://localhost:8003
   - Reclamation Service: http://localhost:8004

### First Time Setup

1. **Create superuser for each service** (in separate terminals):

   ```bash
   docker exec -it smartbin_auth python manage.py createsuperuser
   docker exec -it smartbin_bin_service python manage.py createsuperuser
   docker exec -it smartbin_detection python manage.py createsuperuser
   docker exec -it smartbin_reclamation python manage.py createsuperuser
   ```

2. **Access Django Admin panels**:
   - Auth: http://localhost:8001/admin
   - Bins: http://localhost:8002/admin
   - Detection: http://localhost:8003/admin
   - Reclamation: http://localhost:8004/admin

## 📡 MQTT Topics

- `bin/{bin_id}/open` - Command to open a bin
- `bin/{bin_id}/close` - Command to close a bin
- `bin/{bin_id}/detected` - Material detection event
- `bin/{bin_id}/status` - Bin status updates

## 🔄 Workflow

1. User opens app and scans QR code on bin
2. Frontend sends request to Gateway → Bin Service
3. Bin Service publishes MQTT message to open bin
4. Node-RED receives message and simulates bin opening
5. User throws trash
6. Node-RED simulates material detection
7. Node-RED publishes detection result via MQTT
8. Detection Service receives event and:
   - Logs the detection
   - Awards points to user (via Auth Service)
   - Sends acknowledgment
9. User sees updated points in frontend

## 🛠️ Development

### Running individual services

```bash
# Auth Service
cd services/auth_service
python manage.py runserver 8001

# Bin Service
cd services/bin_service
python manage.py runserver 8002

# Detection Service
cd services/detection_service
python manage.py runserver 8003

# Reclamation Service
cd services/reclamation_service
python manage.py runserver 8004
```

### Viewing logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth_service
docker-compose logs -f mosquitto
```

### Stopping services

```bash
docker-compose down

# With volumes (clean database)
docker-compose down -v
```

## 📦 Technology Stack

- **Backend**: Django 4.2, Django REST Framework
- **Database**: PostgreSQL 15
- **Message Broker**: Eclipse Mosquitto (MQTT)
- **IoT Simulation**: Node-RED
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS

## 🧪 Testing

```bash
# Run tests for a specific service
docker exec -it smartbin_auth python manage.py test

# Run with coverage
docker exec -it smartbin_auth coverage run manage.py test
docker exec -it smartbin_auth coverage report
```

## 🔐 Security Notes

⚠️ **Important**: The current configuration is for DEVELOPMENT ONLY

For production:

1. Change all `SECRET_KEY` values
2. Set `DEBUG=False`
3. Enable MQTT authentication (set `allow_anonymous=false`)
4. Use environment variables for sensitive data
5. Set up proper CORS policies
6. Use HTTPS/TLS for all services
7. Implement rate limiting
8. Add proper logging and monitoring

## 📝 API Documentation

Once services are running, access API docs at:

- http://localhost:8000/api/docs/ (Gateway - coming soon)
- Each service has its own `/api/` endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[Your License Here]

## 👥 Team

[Your Team Info Here]

## 📞 Support

For issues and questions, please open an issue on GitHub.
