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

### Deployment to Google Cloud (Cloud Run + Compute Engine)

This project has been set up to deploy natively to Google Cloud using Cloud Build.

**Architecture:**
- **Frontend**: Google Cloud Run (Serverless)
- **Directus CMS**: Google Compute Engine (VM)
- **Registry**: Google Artifact Registry
- **CI/CD**: Google Cloud Build

**Prerequisites:**
1. Authenticate with Google Cloud CLI: `gcloud auth login`
2. Set your Google Cloud project: `gcloud config set project YOUR_PROJECT_ID`
3. Enable necessary APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com compute.googleapis.com
   ```

**Setup Steps:**
1. **Create Artifact Registry Repo:**
   ```bash
   gcloud artifacts repositories create portfolio --repository-format=docker --location=asia-south1
   ```
2. **Create Compute Engine instance** for Directus:
   ```bash
   gcloud compute instances create portfolio-vm \
     --zone=asia-south1-a \
     --machine-type=e2-medium \
     --tags=http-server,https-server \
     --image-family=debian-11 \
     --image-project=debian-cloud
   ```
   *(Ensure you configure the VM to install Docker and copy `docker-compose.prod.yml`).*

3. **Deploy via Cloud Build**:
   The `cloudbuild.yaml` file is preconfigured to build, push, and deploy the application.
   You can connect your GitHub repository directly to Cloud Build, which will automatically run `cloudbuild.yaml` on every push to `master`.

---

## 4. Example Manual Cloud Build Trigger
```bash
gcloud builds submit --config cloudbuild.yaml .
```
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
