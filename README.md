# TAWAAF APP

A modern, all-in-one Islamic platform bui## Project Structure

```
├── Controllers/           # Business logic handlers
│   ├── authController      # Authentication & authorization logic
│   ├── prayTimeController  # Prayer times calculations
│   ├── weatherController   # Weather data handling
│   ├── userController     # User management
│   ├── emergencyController # Emergency services
│   └── cronJobController   # Scheduled tasks
│
├── Model/                # Database schemas & models
│   ├── userModel         # User profile schema
│   ├── emergencyModel    # Emergency contacts schema
│   └── aroundYouModel    # Local amenities schema
│
├── Routes/               # API route definitions
│   ├── authRoute         # Authentication routes
│   ├── prayTimesRoute    # Prayer times endpoints
│   ├── weatherRoute      # Weather data endpoints
│   ├── emergencyRoute    # Emergency services routes
│   └── userRoutes        # User management endpoints
│
├── Middleware/           # Custom middleware functions
│   ├── errorMiddleware   # Error handling
│   ├── uploadMiddleware  # File upload handling
│   └── validatorMiddleware # Input validation
│
├── Utils/               # Helper functions & utilities
│   ├── appError         # Error handling utilities
│   ├── generateToken    # JWT token management
│   ├── geocode         # Location services
│   ├── sendEmail       # Email notification system
│   └── validator/      # Input validation rules
│
├── locales/            # Internationalization files
│   ├── ar/             # Arabic translations
│   └── en/             # English translations
│
├── views/              # Template files
│   └── profile.pug     # Profile page template
│
├── app.js             # Application entry point
├── config.env         # Environment configuration
├── i18n.js           # Internationalization setup
├── vercel.json       # Vercel deployment config
└── package.json      # Project dependencies
```

## Tech Stack and Express.js, designed to empower Hajj and Umrah pilgrims with essential digital tools, real-time information, and local support services for a safe and fulfilling journey.

## Overview

Tawaaf App offers a comprehensive suite of features to enhance the pilgrimage experience:

- Location-based, precise prayer times (Umm Al-Qura method)
- Real-time weather updates for Saudi Arabia
- Digital identity profiles with QR codes for easy verification
- Health status monitoring and instant visa validity checks
- Emergency contacts, nearby hospitals, pharmacies, restaurants, and hotels for quick access to local support
- Multi-language support (Arabic & English)

## Features

### Prayer Times

- Accurate prayer times based on user location (Umm Al-Qura method)
- Automatic timezone detection and 12-hour formatted times

### Weather Information

- Real-time weather via Tomorrow.io API
- Current conditions, daily and hourly forecasts
- Temperature, wind, humidity, and weather icons
- Smart caching for fast performance

### User Management

- Secure JWT authentication and registration
- Email verification and password reset
- QR code digital profiles for identity and passport info
- Photo upload and profile management
- Health and visa info tracking
- Emergency contacts and tourism company details

### Security

- Password hashing (bcrypt)
- JWT with expiration
- Rate limiting (500 req/5min/IP)
- Secure file upload and input validation
- Helmet.js, CORS, trust proxy

### Additional Services

- Automated email notifications
- Cloudinary image storage
- MongoDB (Mongoose ODM)
- RESTful API
- Error handling and logging
- Cron jobs for visa expiration
- Emergency services by city
- Location-based amenities (restaurants, hotels, pharmacies, etc.)

## Project Structure

```
├── Controllers/     # Business logic
├── Model/           # Mongoose schemas
├── Routes/          # API endpoints
├── Middleware/      # Custom middleware
├── Utils/           # Helpers & validators
├── Templates/       # Email/profile templates
├── app.js           # App entry point
├── vercel.json      # Deployment config
└── package.json     # Dependencies
```

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcrypt
- **File Storage:** Cloudinary
- **APIs:** Tomorrow.io, Adhan.js
- **Security:** Helmet.js, CORS, Rate Limiting
- **Docs:** Postman

## Getting Started

### Prerequisites

- Node.js v14+
- npm
- MongoDB
- Cloudinary account
- Tomorrow.io API key
- Gmail (for email notifications)

### Installation

1. Clone the repo:

   ```bash
   git clone https://github.com/ADIMYY/Tawaf.git
   cd Tawaf
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in `config.env`:

   ```env
   PORT=3000
   NODE_ENV=development
   DATA_BASE=your_mongodb_connection_string
   DB_PASSWORD=your_mongodb_password
   JWT_SECRET_KEY=your_jwt_secret
   JWT_EXPIRE_TIME=90d
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   WEATHER_API_KEY=your_tomorrow_io_api_key
   ```

4. Start the server:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm start
   ```

## API Documentation

Full API docs: [Postman Collection](https://documenter.getpostman.com/view/30662537/2sAYBYgVyB)

### Main Endpoints

- **Auth:** `/api/v1/auth` (signup, login, password reset)
- **Users:** `/api/v1/users` (profile, update, delete)
- **Weather:** `/api/v1/weather/:lat/:lon`
- **Prayer Times:** `/api/v1/prayTimes/:lat/:lon`
- **Data Access:** `/api/v1/get-data` (QR code, passport lookup)
- **Emergency:** `/api/v1/emergency` (city filter, contacts)
- **Cron Jobs:** `/api/v1/cronJob/deleteExpiredVisaUsers`

## Error Handling & Rate Limiting

- Comprehensive error responses (validation, auth, not found, server)
- 500 requests/5min/IP (X-RateLimit headers)

## Development

- Run tests: `npm test`
- Code style: Airbnb JavaScript Style Guide

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit (`git commit -m 'Add YourFeature'`)
4. Push (`git push origin feature/YourFeature`)
5. Open a Pull Request

## Acknowledgments

- Tomorrow.io (weather)
- Adhan.js (prayer times)
- Cloudinary (image hosting)
- MongoDB Atlas (database)
