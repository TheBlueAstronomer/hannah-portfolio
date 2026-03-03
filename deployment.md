# Deployment Guide

This document details the steps to deploy the portfolio application as containers, expose the web page and CMS to the internet, and configure a CI/CD pipeline.

## 1. Container Architecture

The application is composed of two primary services defined in `docker-compose.yml`:
1. **Frontend**: The Vite React application.
2. **Directus CMS**: The headless CMS that manages the portfolio content (articles, endpoints, configuration).

## 2. Exposing the Webpage and CMS

To expose the services reliably and securely to the internet, you should place a reverse proxy in front of the containers.

### Deploying on a Virtual Machine (VM)
If deploying locally via a single VM (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine):
1. Use **Caddy** or **Nginx Proxy Manager**, which can automate HTTPS (Let's Encrypt).
2. Point your DNS records to the VM's public IP address.
3. Configure the proxy to route traffic based on the domain:
   - `admin.yourdomain.com` -> routes to Directus container (port `8055`)
   - `www.yourdomain.com` -> routes to Frontend container (port `4173`)

### Deploying on Kubernetes (GKE)
If using a managed Kubernetes cluster:
1. Define Kubernetes `Service`s for both the Frontend and Directus.
2. Deploy an **Ingress Controller** (e.g., Nginx Ingress or Google Cloud Load Balancer).
3. Create an `Ingress` resource defining rules mapped to your hostnames.
4. Integrate with `cert-manager` to automatically provision TLS certificates.

---

## 3. CI/CD Pipeline Workflow

The Continuous Integration / Continuous Deployment pipeline automates the delivery process, ensuring that pushing code safely ships updates to production.

### High-Level Workflow
1. **Push & Trigger**: A developer pushes code changes to the `master` (or `main`) branch.
2. **Build**: The CI/CD runner is triggered. It checks out the code, lints, runs tests, and builds Docker images using `Dockerfile`.
3. **Registry Push**: The generated Docker images are pushed to an **Artifactory Registry** (e.g., Google Artifact Registry, Docker Hub, JFrog), tagged with the commit SHA and/or `latest`.
4. **Deploy**: The CD step triggers the final deployment to the target environment (GKE or VM).

---

### Strategy A: Deployment to Kubernetes (GKE)

When migrating from Docker Compose to GKE, consider the following architecture adjustments:
- **Statelessness**: Since Kubernetes pods are ephemeral, you must replace the local Directus SQLite databse with a managed external database (e.g., Google Cloud SQL for PostgreSQL).
- **Storage**: Use a cloud storage solution (e.g., Google Cloud Storage) for Directus uploads instead of a local volume.

**Pipeline Steps (GKE):**
1. CI builds the `frontend` image and pushes it to Artifact Registry.
2. CI authenticates with the GKE cluster (e.g., using `gcloud auth`).
3. CI runs `kubectl set image deployment/frontend-deployment frontend=your-registry/frontend:commit-sha`.
4. Kubernetes performs a rolling update, spawning new pods with the updated image and terminating old ones smoothly.

---

### Strategy B: Deployment to Virtual Machines (VMs)

If you are sticking to the Docker Compose setup on a standalone Linux VM:

**Pipeline Steps (VM):**
1. CI builds the `frontend` image and pushes it to Artifact Registry.
2. CI securely connects to the VM via SSH.
3. CI executes a docker login against the Artifactory Registry.
4. CI runs `docker compose pull` on the remote machine to retrieve the newly built image.
5. CI runs `docker compose up -d` to gracefully recreate any containers whose images were updated without downtime.

---

## 4. Example GitHub Actions Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - master

jobs:
  build-publish:
    name: Build & Push Images
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Authenticate to Artifact Registry
        uses: docker/login-action@v2
        with:
          registry: your-registry.domain.com
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push Frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: |
            your-registry.domain.com/hannah-portfolio/frontend:${{ github.sha }}
            your-registry.domain.com/hannah-portfolio/frontend:latest

  deploy-vm:
    name: Deploy to VM
    needs: build-publish
    runs-on: ubuntu-latest
    # Only run this job if deploying to a VM
    steps:
      - name: SSH and Deploy
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_VM_HOST }}
          username: ${{ secrets.PROD_VM_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/hannah-portfolio
            
            # Login to registry
            echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login your-registry.domain.com -u "${{ secrets.REGISTRY_USER }}" --password-stdin
            
            # Pull latest images and restart required containers
            docker compose pull frontend
            docker compose up -d
```
