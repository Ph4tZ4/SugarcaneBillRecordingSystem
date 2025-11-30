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
