# 🚀 SmartBin Setup Guide

Complete guide to set up and run SmartBin on a new machine.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git**
- **Clerk Account** (for authentication) - [Sign up at clerk.com](https://clerk.com)

### Verify Installation

```bash
docker --version
docker-compose --version
git --version
```

## 🔧 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd SmartBin
```

### 2. Environment Variables Setup

#### Frontend Environment Variables

Create `frontend/.env.local` file:

```bash
cd frontend
touch .env.local
```

Add the following content (replace with your actual Clerk credentials):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# API Gateway URL (for server-side calls)
NEXT_PUBLIC_GATEWAY_URL=http://gateway:8000

# Clerk Webhook Secret (for user synchronization)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**How to get Clerk credentials:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select existing one
3. Go to **API Keys** section
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`
5. Go to **Webhooks** section
6. Create a webhook endpoint: `http://your-domain/api/webhooks/clerk` (or use ngrok for local development)
7. Copy **Signing Secret** → `CLERK_WEBHOOK_SECRET`

#### Bin Service Environment Variables

The `CLERK_SECRET_KEY` is already configured in `docker-compose.yml`. If you need to change it, edit the `bin_service` section in `docker-compose.yml`.

### 3. Start All Services

```bash
# From the project root directory
docker-compose up -d
```

This will start:

- MySQL database
- MQTT broker (Mosquitto)
- Auth Service
- Bin Service
- Detection Service
- Reclamation Service
- Gateway
- Frontend
- Node-RED
- phpMyAdmin

**Wait 30-60 seconds** for all services to initialize.

### 4. Check Service Status

```bash
docker-compose ps
```

All services should show `Up` status. If any service shows `Restarting` or `Exited`, check logs:

```bash
docker-compose logs <service_name>
```

### 5. Run Database Migrations

Run migrations for all Django services:

```bash
# Auth Service
docker exec smartbin_auth python manage.py migrate

# Bin Service
docker exec smartbin_bin_service python manage.py migrate

# Detection Service
docker exec smartbin_detection python manage.py migrate

# Reclamation Service
docker exec smartbin_reclamation python manage.py migrate

# Gateway (if needed)
docker exec smartbin_gateway python manage.py migrate
```

**Or use the Makefile:**

```bash
make migrate
```

### 6. Create Admin User (Optional)

To create a Django admin user for database management:

```bash
docker exec -it smartbin_auth python manage.py createsuperuser
```

Follow the prompts to set username, email, and password.

### 7. Configure Clerk Webhook (Important!)

For user synchronization to work, you need to configure Clerk webhook:

1. **For Local Development (using ngrok):**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```
2. **In Clerk Dashboard:**

   - Go to **Webhooks** → **Endpoints**
   - Click **Add Endpoint**
   - Endpoint URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - Subscribe to events:
     - `user.created`
     - `user.updated`
   - Copy the **Signing Secret** and add it to `frontend/.env.local` as `CLERK_WEBHOOK_SECRET`

3. **Restart Frontend:**
   ```bash
   docker-compose restart frontend
   ```

### 8. Verify Setup

#### Access the Application

- **Frontend**: http://localhost:3000
- **Node-RED (IoT Simulator)**: http://localhost:1880
- **phpMyAdmin (Database)**: http://localhost:8080
  - Server: `mysql`
  - Username: `smartbin_user`
  - Password: `smartbin_pass`

#### Test the Flow

1. **Sign Up/Login:**

   - Go to http://localhost:3000
   - Sign up with Clerk (or sign in if you already have an account)
   - You should be redirected to the dashboard

2. **Test Bin Selection:**

   - Click on a bin marker on the map
   - Click "Use NFC" button
   - Go to Node-RED (http://localhost:1880)
   - Click "Simulate NFC Tap" button
   - Bin should open

3. **Test Trash Detection:**
   - In Node-RED, click "Simulate Trash Deposit"
   - Check your points in the dashboard - they should increase!

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Start again
docker-compose up -d
```

### Frontend Build Errors

```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### MQTT Not Working

```bash
# Restart MQTT and related services
docker-compose restart mosquitto detection_service node_red
```

### Clerk Authentication Issues

1. **Check environment variables:**

   ```bash
   docker exec smartbin_frontend env | grep CLERK
   ```

2. **Verify Clerk keys are correct** in `frontend/.env.local`

3. **Check frontend logs:**
   ```bash
   docker-compose logs frontend
   ```

### Points Not Being Awarded

1. **Check detection service logs:**

   ```bash
   docker-compose logs detection_service | grep -i points
   ```

2. **Check auth service logs:**

   ```bash
   docker-compose logs auth_service | grep -i points
   ```

3. **Verify Node-RED flow is running:**
   - Go to http://localhost:1880
   - Check that flows are deployed (no errors)

## 📝 Important Notes

### Database Files

- **Database files are NOT pushed to Git** (correctly ignored in `.gitignore`)
- Databases are created automatically from migrations
- Data is stored in Docker volumes (persists between restarts)
- To reset database: `docker-compose down -v` (WARNING: Deletes all data)

### Environment Variables

- **Never commit `.env.local` files** to Git
- All sensitive keys should be in environment variables
- Use different Clerk keys for development and production

### Docker Volumes

Data persists in Docker volumes:

- `mysql_data` - MySQL database
- `mosquitto_data` - MQTT data
- `node_red_data` - Node-RED flows

To see volumes:

```bash
docker volume ls | grep smartbin
```

## 🎯 Quick Reference

### Essential Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend

# Restart a service
docker-compose restart frontend

# Run migrations
make migrate

# Create admin user
make admin
```

### Service URLs

| Service    | URL                   | Purpose          |
| ---------- | --------------------- | ---------------- |
| Frontend   | http://localhost:3000 | Main application |
| Node-RED   | http://localhost:1880 | IoT Simulator    |
| phpMyAdmin | http://localhost:8080 | Database UI      |
| Gateway    | http://localhost:8000 | API Gateway      |

### Database Credentials

- **Host**: `mysql` (from within Docker) or `localhost:3306` (from host)
- **Database**: `smartbin_db`
- **Username**: `smartbin_user`
- **Password**: `smartbin_pass`
- **Root Password**: `root_password`

## ✅ Setup Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `frontend/.env.local` created with Clerk credentials
- [ ] All services started (`docker-compose up -d`)
- [ ] Migrations run (`make migrate`)
- [ ] Frontend accessible at http://localhost:3000
- [ ] Clerk webhook configured (for user sync)
- [ ] Test user can sign up/login
- [ ] Can select bin and use NFC
- [ ] Can simulate trash deposit
- [ ] Points are awarded correctly

## 🆘 Need Help?

If you encounter issues:

1. Check service logs: `docker-compose logs <service_name>`
2. Verify all services are running: `docker-compose ps`
3. Check environment variables are set correctly
4. Ensure Clerk webhook is configured
5. Review the troubleshooting section above

---

**You're all set! 🎉** The SmartBin system should now be running on your machine.
