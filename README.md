# 🗑️ SmartBin - IoT Waste Management System

A modern, microservices-based smart waste management system with NFC proximity verification, real-time IoT integration, and gamification.

## 🌟 Features

- **NFC Proximity Verification** - Users must physically tap NFC tag to open bins (prevents remote access)
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

- User dashboard, map view, login/register, admin panel

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
- `POST /list/{id}/open/` - Open a bin (requires NFC verification)
- `POST /list/{id}/close/` - Close a bin
- `POST /list/` - Create bin (admin)
- `DELETE /list/{id}/` - Delete bin (admin)

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

- **"Simulate: User Taps NFC"** - Simulate NFC tag scan for proximity verification
- **"Simulate: User Puts Trash"** - Simulate trash detection event
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
make start
# or
docker-compose up -d
```

3. **Run migrations**

```bash
make migrate
```

4. **Create admin user**

```bash
make admin
```

5. **Access the application**

```bash
# Frontend
open http://localhost:3000

# Node-RED (IoT Simulator)
open http://localhost:1880

# phpMyAdmin (Database)
open http://localhost:8080
```

## 🎮 How to Use

### User Flow (NFC-Based)

1. **Login** at `http://localhost:3000/login`
2. **View Map** - See available bins near you
3. **Select Bin** - Click on a bin marker
4. **Use NFC** - Click "Use NFC" button (waits for NFC scan)
5. **Simulate NFC Tap**:
   - Go to Node-RED: `http://localhost:1880`
   - Click **"Simulate: User Taps NFC"** button
   - Bin opens automatically after NFC verification
6. **Simulate Trash Detection**:
   - In Node-RED, click **"Simulate: User Puts Trash"** button
7. **Earn Points** - Watch the points animation! (+10 points)
8. **Track Progress** - View your eco-points in the dashboard

### Admin Flow

1. **Access Admin Dashboard** at `http://localhost:3000/admin`
2. **Add New Bin**:
   - Click "Add New Bin"
   - Enter bin name and location
   - Click on map to set coordinates
   - QR code and NFC tag are auto-generated
3. **Monitor Bins** - View real-time status and fill levels
4. **Delete Bins** - Hover over bin card and click delete

## 🔐 NFC Proximity Verification

### How It Works

1. User selects a bin in the app
2. User clicks "Use NFC" button
3. User physically taps phone on bin's NFC tag (simulated in Node-RED)
4. Backend verifies NFC tag matches the bin
5. Bin opens automatically if verification succeeds
6. User deposits waste
7. IoT sensors detect material (simulated in Node-RED)
8. Points awarded automatically

### Security Benefits

- **Physical Proximity Required** - NFC range is ~4cm, ensures user is at bin
- **No Remote Opening** - Can't open bins from distance
- **Unique Per Bin** - Each bin has unique NFC tag ID (format: `NFC-XXXXXXXXXXXX`)

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
├── Makefile                # Essential commands
└── docker-compose.yml      # Service orchestration
```

## 📊 Database Schema

### Essential Tables (10 total)

**Application Tables (7):**

- `bins` - Smart bin information (with auto-generated QR codes & NFC tags)
- `auth_users` - User accounts with points system
- `auth_points_history` - Points transaction history
- `bin_usage_logs` - Bin usage tracking
- `material_detections` - Waste detection events
- `detection_stats` - Aggregated statistics
- `reclamations` - User complaints/reports

**Django System Tables (3):**

- `django_content_type` - Content type registry
- `django_migrations` - Migration tracking
- `django_session` - Session storage

## 🔧 Makefile Commands

```bash
make help      # Show all available commands
make start     # Start all services
make stop      # Stop all services
make restart   # Restart all services
make status    # Show service status
make logs      # Show logs (use: make logs SERVICE=frontend)
make build     # Build all services
make migrate   # Run database migrations
make admin     # Create admin user
make clean     # Stop and remove containers/volumes
make urls      # Show service URLs
```

## 🐛 Troubleshooting

### Services won't start

```bash
make clean
make start
```

### Frontend build errors

```bash
docker-compose restart frontend
```

### MQTT not receiving messages

```bash
docker-compose restart detection_service node_red
```

### Bin won't open (NFC verification)

1. Make sure you clicked "Use NFC" in the app first
2. Go to Node-RED and click "Simulate: User Taps NFC"
3. Check Node-RED debug panel for errors

### View logs

```bash
# All services
make logs

# Specific service
make logs SERVICE=detection_service
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
