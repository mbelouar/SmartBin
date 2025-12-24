# Deployment Guide

This guide explains how to deploy the SmartBin application using Docker Hub images on a Proxmox machine or any Docker host.

## Prerequisites

- Docker and Docker Compose installed on your Proxmox machine
- Docker Hub account with images pushed (via CI/CD pipeline)
- Access to the repository secrets for Docker Hub credentials

## Setting Up GitHub Actions Secrets

Before the CI/CD pipeline can push images to Docker Hub, you need to configure the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Your Docker Hub access token (create one at https://hub.docker.com/settings/security)

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) automatically:

- Builds all Docker images when you push to `main`/`master` branch
- Tags images with the commit SHA and `latest`
- Pushes images to Docker Hub under `{DOCKERHUB_USERNAME}/smartbin-{service}:latest`

### Triggering the Pipeline

The pipeline runs automatically on:
- Push to `main` or `master` branch
- Push of tags starting with `v*` (e.g., `v1.0.0`)
- Manual trigger via GitHub Actions UI

## Deploying on Proxmox

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd SmartBin
```

### Step 2: Create Environment File

Create a `.env` file in the project root:

```bash
cat > .env << EOF
DOCKERHUB_USERNAME=your-dockerhub-username
SECRET_KEY=your-production-secret-key-here
DEBUG=False
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_BIN_SERVICE_URL=http://localhost:8002
NEXT_PUBLIC_DETECTION_SERVICE_URL=http://localhost:8003
NEXT_PUBLIC_RECLAMATION_SERVICE_URL=http://localhost:8004
EOF
```

### Step 3: Pull Images

```bash
# Set your Docker Hub username
export DOCKERHUB_USERNAME=your-dockerhub-username

# Pull all images
docker-compose -f docker-compose.prod.yml pull
```

### Step 4: Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 5: Access the Application

- **Frontend**: http://your-proxmox-ip:3000
- **API Gateway**: http://your-proxmox-ip:8000
- **phpMyAdmin**: http://your-proxmox-ip:8080
- **Node-RED**: http://your-proxmox-ip:1880

## Updating the Application

When new images are pushed to Docker Hub:

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart services with new images
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Images Not Found

If you get "image not found" errors:

1. Verify your Docker Hub username is correct in `.env`
2. Check that images exist: `docker pull {DOCKERHUB_USERNAME}/smartbin-frontend:latest`
3. Ensure the CI/CD pipeline has successfully pushed images

### Database Migration Issues

If services fail to start due to database issues:

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs auth_service

# Manually run migrations if needed
docker-compose -f docker-compose.prod.yml exec auth_service python manage.py migrate
```

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.prod.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001 if port 3000 is in use
```

## Production Considerations

1. **Security**:
   - Change all default passwords
   - Use strong `SECRET_KEY` values
   - Enable HTTPS with a reverse proxy (nginx/traefik)
   - Restrict database access

2. **Backups**:
   - Regularly backup MySQL volumes: `docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p smartbin_db > backup.sql`
   - Backup Docker volumes

3. **Monitoring**:
   - Set up health checks
   - Monitor container logs
   - Use Docker health checks (already configured)

4. **Resource Limits**:
   - Add resource limits to services in `docker-compose.prod.yml`
   - Monitor resource usage on Proxmox

## Quick Reference

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart [service_name]

# Remove everything (including volumes)
docker-compose -f docker-compose.prod.yml down -v

# Update and restart
docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d
```

