# 📦 CI/CD Pipeline Documentation

This directory contains the CI/CD configuration for automatically building and pushing Docker images to Docker Hub.

## 📁 Files

- **`workflows/docker-build-push.yml`** - GitHub Actions workflow that builds and pushes all Docker images
- **`DEPLOYMENT.md`** - Detailed deployment guide with troubleshooting
- **`QUICK_START.md`** - 3-step quick setup guide

## 🎯 What This Does

When you push to the `main` or `master` branch, the workflow automatically:

1. ✅ Builds 7 Docker images (frontend, gateway, and 5 microservices)
2. ✅ Tags them with `latest` and commit SHA
3. ✅ Pushes them to Docker Hub
4. ✅ Uses Docker layer caching for faster builds

## 🚀 Getting Started

See [QUICK_START.md](QUICK_START.md) for the fastest setup, or [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📊 Images Built

| Service | Image Name |
|---------|-----------|
| Frontend | `smartbin-frontend` |
| Gateway | `smartbin-gateway` |
| Auth Service | `smartbin-auth-service` |
| Bin Service | `smartbin-bin-service` |
| Detection Service | `smartbin-detection-service` |
| Reclamation Service | `smartbin-reclamation-service` |
| Node-RED | `smartbin-node-red` |

## 🔐 Required Secrets

Add these to GitHub Secrets (Settings → Secrets and variables → Actions):

- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

## 📝 Workflow Triggers

- ✅ Push to `main`/`master` branch
- ✅ Manual trigger (Actions tab → Run workflow)
- ✅ Pull requests (builds only, doesn't push)

## 🛠️ Customization

To modify the workflow, edit `.github/workflows/docker-build-push.yml`. Common changes:

- **Change image names**: Update the `tags` field in each build step
- **Add new services**: Add a new build step following the same pattern
- **Change triggers**: Modify the `on:` section at the top

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)

