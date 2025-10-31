# Sparked Backend

This repository contains the backend implementation for Sparked, a web-based dating app. The backend is built with Node.js and Express.js, providing APIs for user authentication, profile management, matching, messaging, and notifications.

## Description

The backend handles the core functionalities of the Sparked app, including:

- User authentication and authorization
- Profile creation and management
- Matching logic
- Real-time messaging
- Notifications for new matches and messages

## Tech Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **Real-time Communication**: Socket.IO
- **Deployment**: Heroku

## Features

- **User Authentication**:
  - Secure login and registration using email and password
  - Token-based authentication with JWT
- **Profile Management**:
  - Create and update user profiles
  - Store user data in MongoDB
- **Matching System**:
  - Swipe-based matching logic
  - Match only when both users like each other
- **Messaging**:
  - Real-time chat between matched users
  - Store chat history in MongoDB
- **Notifications**:
  - Push notifications for new matches and messages


### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB instance (local or cloud-based)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/john-andeyyy/Dating_App_Backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Dating_App_Backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory and add the following environment variables:

   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_Refresh=your_jwt_secret
   ```

2. Update `vercel.json` if deploying to Vercel.

### Running the Server

Start the development server:

```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### User Authentication

- **POST** `/api/auth/register`: Register a new user
- **POST** `/api/auth/login`: Login an existing user

### Profile Management

- **GET** `/api/user/profile`: Get user profile
- **PUT** `/api/user/profile`: Update user profile

### Matching

- **GET** `/api/match`: Get potential matches
- **POST** `/api/match`: Like or skip a profile

### Messaging

- **GET** `/api/message/:matchId`: Get chat history
- **POST** `/api/message/:matchId`: Send a message

## Authors

- **Andrei** – Backend Developer
