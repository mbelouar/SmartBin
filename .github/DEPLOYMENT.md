# 🚀 Docker Hub Deployment Guide

This project uses GitHub Actions to automatically build and push Docker images to Docker Hub.

## 📋 Prerequisites

1. A Docker Hub account ([Sign up here](https://hub.docker.com/signup))
2. A GitHub repository with this project

## 🔐 Setting Up GitHub Secrets

To enable automatic Docker image builds and pushes, you need to add your Docker Hub credentials as GitHub Secrets:

### Step 1: Get Your Docker Hub Credentials

1. Go to [Docker Hub](https://hub.docker.com/)
2. Sign in to your account
3. Go to **Account Settings** → **Security**
4. Create an **Access Token** (recommended) or use your password

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

   - **Name:** `DOCKER_USERNAME`

     - **Value:** Your Docker Hub username

   - **Name:** `DOCKER_PASSWORD`
     - **Value:** Your Docker Hub password or access token

## 🎯 How It Works

The CI/CD pipeline automatically:

1. **Triggers on:**

   - Push to `main` or `master` branch
   - Push of version tags (e.g., `v1.0.0`)
   - Manual workflow dispatch (Actions tab → Run workflow)
   - Pull requests (builds only, doesn't push)

2. **Builds 7 Docker images:**

   - `smartbin-frontend` (Next.js)
   - `smartbin-gateway` (Django API Gateway)
   - `smartbin-auth-service` (Django)
   - `smartbin-bin-service` (Django)
   - `smartbin-detection-service` (Django)
   - `smartbin-reclamation-service` (Django)
   - `smartbin-node-red` (Node-RED)

3. **Tags images with:**

   - `latest` (for main/master branch)
   - Git commit SHA (e.g., `abc123def456`)

4. **Pushes to Docker Hub:**
   - `your-username/smartbin-frontend:latest`
   - `your-username/smartbin-frontend:abc123def456`
   - (and so on for all services)

## 📦 Using the Images

After the workflow completes, you can pull and use the images:

```bash
# Pull latest images
docker pull your-username/smartbin-frontend:latest
docker pull your-username/smartbin-gateway:latest
docker pull your-username/smartbin-auth-service:latest
docker pull your-username/smartbin-bin-service:latest
docker pull your-username/smartbin-detection-service:latest
docker pull your-username/smartbin-reclamation-service:latest
docker pull your-username/smartbin-node-red:latest
```

## 🔄 Updating docker-compose.yml for Production

To use the Docker Hub images instead of building locally, update your `docker-compose.yml`:

```yaml
services:
  frontend:
    image: your-username/smartbin-frontend:latest
    # Remove: build: context: ./frontend

  gateway:
    image: your-username/smartbin-gateway:latest
    # Remove: build: context: ./gateway

  auth_service:
    image: your-username/smartbin-auth-service:latest
    # Remove: build: context: ./services/auth_service

  # ... and so on for all services
```

## 🐛 Troubleshooting

### Workflow fails with "authentication required"

- Check that `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set correctly
- Verify your Docker Hub credentials are valid
- For access tokens, make sure they have read/write permissions

### Images not appearing on Docker Hub

- Check the workflow logs in the Actions tab
- Ensure the workflow completed successfully (green checkmark)
- Verify you're looking at the correct Docker Hub repository

### Build takes too long

- The workflow uses Docker layer caching (GitHub Actions cache)
- Subsequent builds will be faster
- Consider using a self-hosted runner for even faster builds

## 📝 Manual Workflow Trigger

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Build and Push Docker Images**
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Buildx](https://docs.docker.com/buildx/)

---

**Note:** Make sure to keep your Docker Hub credentials secure and never commit them to the repository!
