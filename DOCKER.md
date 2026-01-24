# 🐳 Docker Deployment Guide

Complete guide for deploying BatteryForge AI using Docker containers.

## Overview

The BatteryForge AI Docker setup consists of:
- **Backend Container**: FastAPI application with Python 3.11
- **Frontend Container**: React application served by Nginx
- **Persistent Volumes**: Database, ChromaDB knowledge base, and file uploads
- **Docker Network**: Isolated network for service communication

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Host Machine (Port 80, 8000)                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Docker Network: batteryforge-network     │  │
│  │                                           │  │
│  │  ┌──────────────┐    ┌─────────────────┐ │  │
│  │  │   Frontend   │───▶│     Backend     │ │  │
│  │  │  (Nginx:80)  │    │  (FastAPI:8000) │ │  │
│  │  └──────────────┘    └─────────────────┘ │  │
│  │                             │             │  │
│  │                             ▼             │  │
│  │                   ┌──────────────────┐    │  │
│  │                   │ Persistent Data  │    │  │
│  │                   │ - SQLite DB      │    │  │
│  │                   │ - ChromaDB       │    │  │
│  │                   │ - Uploads        │    │  │
│  │                   └──────────────────┘    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Quick Start

### 1. Prerequisites

Ensure you have installed:
- Docker Engine 20.10+
- Docker Compose 2.0+

**Verify installation:**
```bash
docker --version
docker compose --version
```

### 2. Configuration

Create environment file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Build and Run

**Start all services:**
```bash
docker compose up --build
```

**Or run in background (detached mode):**
```bash
docker compose up -d --build
```

**Initial build may take 5-10 minutes** as it:
- Builds Python environment with scientific libraries (NumPy, SciPy, PyBaMM)
- Compiles frontend React application
- Sets up Nginx configuration

### 4. Access Application

Once running, access:
- **Frontend UI**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Container Details

### Backend Container

**Image**: Custom Python 3.11 slim-based image
**Ports**: 8000 (exposed to host)
**Volumes**:
- `battery-db:/app/battery_forge.db` - SQLite database
- `chroma-db:/app/chroma_db` - ChromaDB vector store
- `uploads:/app/uploads` - User uploaded files

**Environment Variables**:
- `GEMINI_API_KEY` - Required for AI functionality

**Health Check**: HTTP GET to `/health` every 30s

### Frontend Container

**Image**: Multi-stage build (Node.js builder → Nginx runtime)
**Ports**: 80 (exposed to host)
**Features**:
- Nginx with gzip compression
- SPA routing (all routes serve index.html)
- API proxy to backend (`/api/*` → `http://backend:8000/api/*`)
- WebSocket support for real-time features
- Static asset caching (1 year for JS/CSS/images)

**Health Check**: HTTP GET to `/` every 30s

## Common Operations

### Viewing Logs

**All services:**
```bash
docker compose logs -f
```

**Specific service:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Last 100 lines:**
```bash
docker compose logs --tail=100 backend
```

### Restarting Services

**Restart all:**
```bash
docker compose restart
```

**Restart specific service:**
```bash
docker compose restart backend
```

### Stopping Services

**Stop containers (preserves data):**
```bash
docker compose stop
```

**Stop and remove containers:**
```bash
docker compose down
```

**⚠️ Stop and DELETE all data:**
```bash
docker compose down -v
```

### Rebuilding After Code Changes

**Rebuild all:**
```bash
docker compose up --build
```

**Rebuild specific service:**
```bash
docker compose build backend
docker compose up -d backend
```

**Force clean rebuild:**
```bash
docker compose build --no-cache
docker compose up -d
```

## Data Persistence

### Volumes

Three named volumes ensure data persists across container restarts:

1. **battery-db** - SQLite database with analysis history
2. **chroma-db** - Vector embeddings for RAG knowledge base
3. **uploads** - User-uploaded battery images, CSV files, videos

### Backup Data

**Export volumes:**
```bash
# Create backup directory
mkdir -p backups

# Backup database
docker run --rm -v batteryforgeai_battery-db:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/battery-db.tar.gz -C /data .

# Backup ChromaDB
docker run --rm -v batteryforgeai_chroma-db:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/chroma-db.tar.gz -C /data .

# Backup uploads
docker run --rm -v batteryforgeai_uploads:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .
```

### Restore Data

```bash
# Restore database
docker run --rm -v batteryforgeai_battery-db:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/battery-db.tar.gz -C /data

# Restore ChromaDB
docker run --rm -v batteryforgeai_chroma-db:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/chroma-db.tar.gz -C /data

# Restore uploads
docker run --rm -v batteryforgeai_uploads:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads.tar.gz -C /data
```

## Troubleshooting

### Port Already in Use

If port 80 or 8000 is already used:

**Check what's using the port:**
```bash
sudo lsof -i :80
sudo lsof -i :8000
```

**Option 1: Stop conflicting service**
```bash
sudo systemctl stop apache2  # or nginx
```

**Option 2: Change ports in docker compose.yml**
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Use port 8080 instead
  backend:
    ports:
      - "8001:8000"  # Use port 8001 instead
```

### Container Fails to Start

**Check logs:**
```bash
docker compose logs backend
docker compose logs frontend
```

**Common issues:**
1. **Missing GEMINI_API_KEY**: Ensure `.env` file exists with valid key
2. **Permission issues**: Run `docker compose down -v` and rebuild
3. **Out of disk space**: Run `docker system prune -a`

### Backend Can't Connect to Gemini API

**Verify API key:**
```bash
docker compose exec backend env | grep GEMINI
```

**Test manually:**
```bash
docker compose exec backend python -c "import os; print(os.getenv('GEMINI_API_KEY'))"
```

### Frontend Can't Connect to Backend

**Verify backend is healthy:**
```bash
docker compose ps
curl http://localhost:8000/health
```

**Check Nginx proxy configuration:**
```bash
docker compose exec frontend cat /etc/nginx/conf.d/default.conf
```

**Restart frontend:**
```bash
docker compose restart frontend
```

### Build Failures

**Clear Docker cache:**
```bash
docker compose down
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

## Production Deployment

### Security Hardening

1. **Use secrets management:**
```yaml
# docker compose.prod.yml
services:
  backend:
    environment:
      - GEMINI_API_KEY_FILE=/run/secrets/gemini_key
    secrets:
      - gemini_key

secrets:
  gemini_key:
    external: true
```

2. **Enable HTTPS with Let's Encrypt:**
- Use Traefik or Caddy as reverse proxy
- Or configure Certbot with Nginx

3. **Restrict CORS in production:**
Edit `backend/main.py`:
```python
allow_origins=["https://yourdomain.com"]
```

### Performance Optimization

**Increase worker processes:**
Edit backend Dockerfile CMD:
```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Enable Docker BuildKit:**
```bash
export DOCKER_BUILDKIT=1
docker compose build
```

### Resource Limits

Add to `docker compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 1G
```

## Monitoring

### Health Checks

**Manual check:**
```bash
docker compose ps
```

Look for `(healthy)` status.

### Resource Usage

```bash
docker stats
```

### Container Inspection

```bash
docker compose exec backend ps aux
docker compose exec frontend ps aux
```

## Cleanup

### Remove All Containers and Images

```bash
docker compose down
docker rmi batteryforgeai_frontend batteryforgeai_backend
```

### Complete System Cleanup

⚠️ **Warning: Removes all Docker resources (not just this project)**
```bash
docker system prune -a --volumes
```

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key for AI functionality |

### Future Extensions

Potential additions:
- `DATABASE_URL` - External PostgreSQL for production
- `REDIS_URL` - Caching layer
- `LOG_LEVEL` - Logging verbosity (DEBUG, INFO, WARNING, ERROR)
- `MAX_UPLOAD_SIZE` - File upload limit in MB

## Support

For issues or questions:
1. Check the logs: `docker compose logs -f`
2. Verify health: `docker compose ps`
3. Review this guide's troubleshooting section
4. Open an issue on GitHub

---

**Built with ❤️ for containerized deployment**
