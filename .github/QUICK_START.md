# ⚡ Quick Start - CI/CD Setup

## 🎯 3-Step Setup

### 1. Create Docker Hub Account
- Sign up at [hub.docker.com](https://hub.docker.com/signup)
- Note your username

### 2. Add GitHub Secrets
1. Go to: **Repository → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add these two secrets:

| Secret Name | Value |
|------------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or [access token](https://hub.docker.com/settings/security) |

### 3. Push to GitHub
```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

That's it! 🎉 

The workflow will automatically:
- Build all 7 Docker images
- Push them to Docker Hub
- Tag them as `latest` and with commit SHA

## 📦 View Your Images

After the workflow completes (check the Actions tab), your images will be available at:
- `https://hub.docker.com/r/YOUR_USERNAME/smartbin-frontend`
- `https://hub.docker.com/r/YOUR_USERNAME/smartbin-gateway`
- ... and so on

## 🔍 Check Workflow Status

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. See build progress and logs

## 🐛 Troubleshooting

**Workflow fails?**
- ✅ Check secrets are set correctly
- ✅ Verify Docker Hub credentials work
- ✅ Check workflow logs in Actions tab

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation.

