# 🗑️ SmartBin - IoT Waste Management System

A modern, microservices-based smart waste management system with real-time IoT integration, gamification, and location-based bin tracking.

## 🌟 Features

- **Smart Bin Management** - Real-time bin monitoring with fill level tracking
- **IoT Integration** - MQTT-based communication with waste detection sensors
- **Gamification** - Earn points for recycling different materials
- **Interactive Map** - Find nearby bins with live availability status
- **Material Detection** - AI-powered waste classification
- **User Dashboard** - Track eco-points, recycling stats, and achievements
- **Admin Panel** - Manage bins, view analytics, and monitor system health

## 🏗️ Architecture

SmartBin follows a **microservices architecture** with event-driven communication via MQTT.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                    http://localhost:3000                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (Django)                         │
│                    http://localhost:8000                         │
│              Routes requests to microservices                    │
└──┬────────────┬────────────┬────────────┬─────────────────────┘
   │            │            │            │
   ▼            ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   Auth   │ │   Bin    │ │Detection │ │Reclamation│
│ Service  │ │ Service  │ │ Service  │ │  Service  │
│  :8001   │ │  :8002   │ │  :8003   │ │   :8004   │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
     │            │            │
     └────────────┴────────────┴─────────────┐
                                              │
                  ┌───────────────────────────┼─────────────────┐
                  │                           │                 │
                  ▼                           ▼                 ▼
         ┌──────────────┐          ┌──────────────┐   ┌──────────────┐
         │    MySQL     │          │   Mosquitto  │   │   Node-RED   │
         │   Database   │          │ MQTT Broker  │   │ IoT Simulator│
         │    :3306     │          │    :1883     │   │    :1880     │
         └──────────────┘          └──────────────┘   └──────────────┘
```

## 🔄 Service Communication

### HTTP (REST APIs)

- **Frontend** → **Gateway** → **Microservices**
- JWT-based authentication
- JSON request/response

### MQTT (Event-Driven)

- **Bin Service** → publishes `bin/{id}/open` and `bin/{id}/close`
- **Node-RED** → publishes `bin/{id}/detected` (trash detection)
- **Detection Service** → subscribes to `bin/+/detected` (processes detections)

## 📡 Service Endpoints

### Frontend (Next.js)

```
http://localhost:3000
```

- User dashboard, map view, login/register

### API Gateway

```
http://localhost:8000
```

- `/api/auth/*` → Auth Service
- `/api/bins/*` → Bin Service
- `/api/detections/*` → Detection Service
- `/api/reclamations/*` → Reclamation Service

### Auth Service

```
http://localhost:8001/api/auth
```

- `POST /login/` - User login
- `POST /register/` - User registration
- `GET /profile/` - User profile
- `GET /points/history/` - Points history

### Bin Service

```
http://localhost:8002/api/bins
```

- `GET /list/` - List all bins
- `POST /list/{id}/open/` - Open a bin
- `POST /list/{id}/close/` - Close a bin
- `POST /list/` - Create bin (admin)

### Detection Service

```
http://localhost:8003/api/detections
```

- `GET /list/` - List detections
- `GET /stats/` - Detection statistics

### Node-RED (IoT Simulator)

```
http://localhost:1880
```

- Simulate trash detection
- Monitor MQTT messages
- Debug IoT events

### phpMyAdmin (Database UI)

```
http://localhost:8080
```

- Server: `mysql`
- Username: `smartbin_user`
- Password: `smartbin_pass`

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd SmartBin
```

2. **Start all services**

```bash
docker-compose up -d
```

3. **Wait for services to initialize** (~30 seconds)

4. **Access the application**

```bash
# Frontend
open http://localhost:3000

# Node-RED (IoT Simulator)
open http://localhost:1880

# phpMyAdmin (Database)
open http://localhost:8080
```

### Create Test Users

```bash
# Admin user
docker exec smartbin_auth python manage.py shell -c "
from accounts.models import CustomUser;
CustomUser.objects.create_superuser(
    username='admin',
    email='admin@smartbin.com',
    password='admin123',
    qr_code='SB-ADMIN-001'
)
"

# Regular user
docker exec smartbin_auth python manage.py shell -c "
from accounts.models import CustomUser;
CustomUser.objects.create_user(
    username='user',
    email='user@smartbin.com',
    password='user123',
    qr_code='SB-USER-001'
)
"
```

## 🎮 How to Use

### User Flow

1. **Login** at `http://localhost:3000/login`
2. **View Map** - See available bins near you
3. **Select Bin** - Click on a bin marker
4. **Open Bin** - Press "Open Bin" button
5. **Simulate Trash Detection**:
   - Go to Node-RED: `http://localhost:1880`
   - Click "Simulate: User Puts Trash" button
6. **Earn Points** - Watch the points animation!
7. **Track Progress** - View your eco-points in the dashboard

### Admin Flow

1. **Access Admin Dashboard** at `http://localhost:3000/admin`
2. **Add New Bin** - Click on map to set location
3. **Monitor Bins** - View real-time status and fill levels
4. **Analytics** - Track usage and recycling statistics

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Maps**: Leaflet (OpenStreetMap)
- **Animations**: Framer Motion

### Backend

- **Framework**: Django + Django REST Framework
- **Language**: Python 3.11
- **Authentication**: JWT (SimpleJWT)
- **API Pattern**: RESTful microservices

### Infrastructure

- **Database**: MySQL 8.0
- **Message Broker**: Mosquitto MQTT
- **IoT Simulator**: Node-RED
- **Containerization**: Docker + Docker Compose

## 📁 Project Structure

```
SmartBin/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   └── lib/                 # API client, types, utilities
├── services/
│   ├── auth_service/        # User authentication & management
│   ├── bin_service/         # Bin CRUD & IoT control
│   ├── detection_service/   # Material detection & points
│   └── reclamation_service/ # Issue reporting
├── gateway/                 # API Gateway (routing)
├── node-red/               # IoT simulation flows
├── infrastructure/
│   └── mosquitto/          # MQTT broker config
└── docker-compose.yml      # Service orchestration
```

## 🔧 Configuration

### Environment Variables

Each service can be configured via environment variables in `docker-compose.yml`:

- **Database**: `DATABASE_URL`
- **MQTT**: `MQTT_BROKER`, `MQTT_PORT`
- **JWT**: `SECRET_KEY`
- **Debug**: `DEBUG=True`

## 📊 Database Schema

### Core Models

- **CustomUser** - User accounts with QR codes and points
- **Bin** - Smart bin locations and status
- **MaterialDetection** - Waste detection records
- **Reclamation** - User-reported issues

## 🐛 Troubleshooting

### Services won't start

```bash
docker-compose down -v
docker-compose up -d --build
```

### Frontend build errors

```bash
docker-compose restart frontend
```

### MQTT not receiving messages

```bash
docker-compose restart detection_service node_red
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f [service_name]
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Node-RED for IoT simulation
- shadcn/ui for beautiful UI components

---

**Built with ❤️ for a sustainable future** 🌍♻️
