# Hannah Portfolio

This project is a personal portfolio and blog application built with **React** and **Vite**, featuring a modern and dynamic user interface. The content is managed dynamically using **Sanity CMS**, ensuring a seamless authoring experience for portfolio items, articles, and testimonials.

## Features
- **Frontend**: React, Vite, Framer Motion, and GSAP for fast, highly animated, and interactive user experiences.
- **Backend/CMS**: Sanity Studio to manage structured content like Skills, Portfolio Projects, Testimonials, and Articles.
- **Styling**: SCSS and Tailwind CSS.

## Getting Started

To get started with the development environment, you will need to run both the React frontend and the Sanity backend.

### 1. Frontend (React + Vite)
Open a terminal in the root directory and install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The frontend should now be running (usually at `http://localhost:5173`).

### 2. Backend (Sanity CMS)
Open a new terminal window and navigate to the `backend_sanity` directory:
```bash
cd backend_sanity
```

Install the backend dependencies:
```bash
npm install
```

Start the Sanity Studio:
```bash
npm run dev
```
Sanity Studio will be available locally (usually at `http://localhost:3333`), where you can edit the portfolio content and schemas.

## Build and Deployment

To build the project for production, run:
```bash
# In the root directory (for frontend)
npm run build

# In the backend_sanity directory (for sanity)
npm run build
```
