# Sugarcane Bill Recording System

This project is a web application for recording and managing sugarcane bills. It consists of a React frontend and a Node.js/Express backend.

## Project Structure

- **client**: Frontend application built with React, Vite, and Tailwind CSS.
- **server**: Backend application built with Node.js, Express, and MongoDB.

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd SugarcaneBillRecordingSystem
    ```

2.  **Install dependencies for Client:**
    ```bash
    cd client
    npm install
    ```

3.  **Install dependencies for Server:**
    ```bash
    cd ../server
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd server
    npm run dev
    ```

2.  **Start the Frontend Client:**
    ```bash
    cd client
    npm run dev
    ```

## Features

- Record sugarcane bills with details like date, type, weight, and price.
- Automatic price calculation based on date and sugarcane type.
- Manage price configurations.
- Export bill data to Excel.

## Deployment Configuration

### 1. Server (Render / Production)
Set the following environment variables on your server (e.g., Render):

- `PORT`: (Optional) Port to run the server (Render sets this automatically).
- `MONGODB_URI`: Connection string for your MongoDB (e.g., MongoDB Atlas).
- `JWT_SECRET`: Secret key for JWT (use a strong random string).
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs.
  - Example: `https://sugarcane-client.vercel.app`

### 2. Client (Vercel / Production)
Set the following environment variable in Vercel:

- `VITE_API_URL`: The full URL of your deployed backend server.
  - Example: `https://sugarcane-server.onrender.com`

### Local Development
- **Server**: Create a `.env` file in the `server` folder (or rely on defaults).
- **Client**: No config needed. It uses `vite.config.ts` proxy to forward `/api` requests to `http://localhost:5001`.
