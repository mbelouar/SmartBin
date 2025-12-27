# 🗑️ SmartBin - IoT Waste Management System

A modern, microservices-based smart waste management system with NFC proximity verification, real-time IoT integration, and gamification.

## 🌟 Features

- **NFC Proximity Verification** - Physical tap required to open bins
- **Smart Bin Management** - Real-time monitoring with fill level tracking
- **IoT Integration** - MQTT-based communication with waste detection sensors
- **Gamification** - Earn points for recycling
- **Interactive Map** - Find nearby bins with live availability
- **Material Detection** - AI-powered waste classification
- **Admin Panel** - Manage bins and view analytics

## 🏗️ Architecture

```
Frontend (Next.js) :3000
    ↓
API Gateway :8000
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│   Auth   │   Bin    │Detection │Reclamation│
│  :8001   │  :8002   │  :8003   │   :8004   │
└────┬─────┴────┬─────┴────┬─────┴──────────┘
     │          │          │
     └──────────┴──────────┴───────┐
                                   │
          ┌────────────┬───────────┴──────────┐
          │   MySQL    │   Mosquitto  │ Node-RED│
          │   :3306    │    :1883     │  :1880  │
          └────────────┴──────────────┴─────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone <repository-url>
cd SmartBin

# Start all services
make start

# Run migrations
make migrate

# Create admin user
make admin

# Access application
# Frontend: http://localhost:3000
# Node-RED: http://localhost:1880
# Gateway: http://localhost:8000
# phpMyAdmin: http://localhost:8080
```

## 🚀 Production Deployment

```bash
# Pull images from Docker Hub
make pull-images

# Start production services
make start-prod

# Run migrations
make migrate-prod
```

**Note:** Uses `docker-compose.prod.yml` with pre-built images from `mbelouar/smartbin-*`

## 🎮 Usage

1. Login at `http://localhost:3000`
2. Select a bin on the map
3. Click "Use NFC" and simulate tap in Node-RED (`http://localhost:1880`)
4. Simulate trash detection in Node-RED to earn points

## 🛠️ Technology Stack

**Frontend:** Next.js 16, TypeScript, Tailwind CSS, Clerk  
**Backend:** Django 4.2, Django REST Framework, Python 3.11  
**Infrastructure:** MySQL 8.0, Mosquitto MQTT, Node-RED, Docker

## 🔧 Makefile Commands

```bash
make help          # Show all commands
make start         # Start all services
make stop          # Stop all services
make migrate       # Run migrations
make admin         # Create admin user
make logs          # Show logs (use: make logs SERVICE=frontend)
make clean         # Stop and remove containers/volumes

# Production
make pull-images   # Pull images from Docker Hub
make start-prod    # Start production services
make migrate-prod  # Run migrations (production)
```

## 🐛 Troubleshooting

```bash
# Services won't start
make clean && make start

# View logs
make logs SERVICE=frontend

# Restart service
docker-compose restart [service_name]
```

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.
