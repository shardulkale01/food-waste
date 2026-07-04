# 🍽️ Food Rescue Map

A full-stack web application that connects restaurants with surplus food to individuals and NGOs in real-time via an interactive map. Built to reduce food waste by making it easy for restaurants to list excess food and for users to discover, claim, and pick it up — all through a modern, brutalist-inspired UI.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet)

---

## 📸 Features

### For Users / NGOs
- **Interactive Map** — Browse nearby food listings on a real-time Leaflet map with GPS-based location detection
- **Claim Food** — Reserve surplus food with a single click
- **Contact Restaurants** — Reach out via phone call or WhatsApp directly from the map popup
- **My Claims** — Track all food you've claimed in a dedicated sidebar view
- **Distance Awareness** — Haversine formula calculates distances between you and food sources

### For Restaurants
- **Post Surplus Food** — List food items with name, quantity, price, pickup time, and contact info
- **Location Picker** — Set your restaurant's exact location via GPS auto-detect, manual coordinates, or clicking on the map
- **Manage Postings** — View and track all active and claimed food listings
- **Real-time Updates** — Listings appear instantly on the user-facing map

### General
- **Dual Role Authentication** — Sign up as a User/NGO or a Restaurant with role-based routing
- **Demo Mode** — Works without Firebase credentials using mock authentication
- **Responsive Design** — Fully functional on desktop and mobile devices
- **Brutalist Map UI** — The user-facing map features a bold, brutalist design with thick borders, high-contrast colors, and industrial typography

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router v7 |
| **Styling** | Tailwind CSS v4, Custom CSS (Brutalist theme) |
| **Map** | Leaflet + React-Leaflet |
| **Icons** | Lucide React |
| **Auth** | Firebase Authentication (with mock fallback) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Deployment** | Firebase Hosting (frontend), Docker-ready (backend) |

---

## 📂 Project Structure

```
food-waste/
├── .gitignore                  # Git ignore rules
│
├── frontend/                   # React + Vite frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Images and static resources
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Landing/marketing page
│   │   │   ├── Auth.jsx        # Login/signup with role selection
│   │   │   ├── UserMap.jsx     # Brutalist map UI for food discovery
│   │   │   └── RestaurantDashboard.jsx  # Restaurant food posting panel
│   │   ├── firebase.js         # Firebase configuration & auth export
│   │   ├── App.jsx             # Root component with routing & auth state
│   │   ├── App.css             # App-level styles
│   │   ├── index.css           # Global styles (Tailwind + Brutalist theme)
│   │   └── main.jsx            # React entry point
│   ├── index.html              # HTML template
│   ├── .env                    # Frontend environment variables
│   ├── .firebaserc             # Firebase project config
│   ├── firebase.json           # Firebase hosting config
│   ├── vite.config.js          # Vite build configuration
│   ├── eslint.config.js        # ESLint configuration
│   └── package.json            # Frontend dependencies
│
├── backend/                    # Express + MongoDB backend
│   ├── models/
│   │   ├── FoodListing.js      # Mongoose schema for food listings
│   │   └── User.js             # Mongoose schema for users
│   ├── tests/
│   │   └── claim.test.js       # API endpoint tests
│   ├── server.js               # Express server with all API routes
│   ├── .env                    # Backend environment variables
│   ├── .env.example            # Template for backend env vars
│   ├── Dockerfile              # Docker config for backend deployment
│   └── package.json            # Backend dependencies
│
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** account (free tier works) — or the app falls back to in-memory demo data
- **Firebase** project (optional — app has built-in mock auth)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/food-rescue-map.git
cd food-rescue-map
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (or copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/food-rescue?retryWrites=true&w=majority
```

Start the backend server:

```bash
node server.js
```

The API will be running at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

The frontend `.env` is pre-configured for local development:

```env
VITE_API_URL=http://localhost:5000
```

If you have Firebase credentials, add them to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note:** Without Firebase credentials, the app automatically uses **Demo Mode** with mock authentication — fully functional for testing.

Start the frontend dev server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/foods` | Get all available (unclaimed, unexpired) food listings |
| `POST` | `/api/add-food` | Create a new food listing |
| `PATCH` | `/api/foods/:id/claim` | Claim a food listing |
| `GET` | `/api/foods/my-claims/:userId` | Get a user's claimed food |
| `GET` | `/api/foods/my-postings/:restaurantId` | Get a restaurant's postings |
| `POST` | `/api/users` | Sync/create user from Firebase auth |

---

## 🗄️ Database Models

### FoodListing

| Field | Type | Description |
|-------|------|-------------|
| `restaurantId` | String | Firebase UID of the restaurant |
| `restaurantName` | String | Display name of the restaurant |
| `foodName` | String | Name of the food item |
| `quantity` | String | Amount available (e.g. "5 boxes") |
| `price` | Number | Price in ₹ (0 = free) |
| `description` | String | Optional dietary info or notes |
| `latitude` | Number | GPS latitude |
| `longitude` | Number | GPS longitude |
| `pickupTime` | String | Pickup deadline time |
| `contactNumber` | String | Phone/WhatsApp contact |
| `isClaimed` | Boolean | Whether food has been claimed |
| `claimedBy` | String | Firebase UID of the claimer |
| `expiryDate` | Date | Auto-expires 24h after creation |

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Firebase UID (unique) |
| `name` | String | Display name |
| `email` | String | Email address |
| `phone` | String | Phone number |
| `role` | String | `"restaurant"` or `"user"` |

---

## 🎨 Design Philosophy

The app uses two distinct design languages:

### Brutalist (User Map)
- **Thick borders** (3-4px solid black)
- **Box shadows** that create a physical "pressed" effect (`4px 4px 0px #000`)
- **Grayscale map tiles** with high contrast
- **Dark UI** with `#1a1a1a` backgrounds
- **Accent color**: `#ff5722` (deep orange)
- **All-caps typography** with heavy tracking
- **No border-radius** — everything is deliberately angular
- **Interactive press-down effects** on buttons

### Marble (Landing, Auth, Dashboard)
- Warm, earthy tones (`#fdfaf5`, `#f9f4ea`, `#f3f0e8`)
- Smooth rounded corners (`border-radius: 24px`)
- Subtle box shadows with soft blur
- Emerald accents (`#059669`)
- Clean, editorial typography

---

## 🐳 Docker Deployment (Backend)

```bash
cd backend
docker build -t food-rescue-api .
docker run -p 8080:8080 --env-file .env food-rescue-api
```

The Dockerfile uses `node:18-slim` and exposes port `8080` for Cloud Run compatibility.

---

## 🔧 Configuration

### Environment Variables

**Frontend (`.env`)**
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_FIREBASE_*` | No | Firebase config (falls back to demo mode) |

**Backend (`.env`)**
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |

---

## 🧪 Testing

```bash
cd backend
npm test
```

Tests cover the food claim API endpoint validation.

---

## 📱 User Flow

```
Landing Page → Sign Up/Sign In (select role)
   │
   ├── Restaurant → Dashboard
   │   └── Post food → Set location → Publish → Manage postings
   │
   └── User/NGO → Map View
       └── Browse map → View popup → Call/WhatsApp → Claim food → Track claims
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  <strong>Built with ❤️ to fight food waste</strong><br/>
  <sub>Every meal saved is a step towards a greener planet.</sub>
</p>
