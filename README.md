# TAWAAF APP

A comprehensive Islamic application built with Node.js and Express.js framework, providing prayer times, weather information, and user management features for Hajj and Umrah pilgrims.

## Overview

Tawaaf App is designed to assist pilgrims with:

- Accurate prayer time information based on their location
- Real-time weather updates in Saudi Arabia
- Digital identity management through QR codes
- Health information tracking
- Visa status monitoring
- Emergency contact management

## Features

### Prayer Times

- Accurate prayer time calculations based on location coordinates
- Support for multiple calculation methods (Umm Al-Qura)
- Automatic timezone detection
- Formatted prayer times in 12-hour format
- Real-time updates for each prayer time

### Weather Information

- Real-time weather data using Tomorrow.io API
- Current weather conditions with detailed descriptions
- Temperature forecasts with day/night breakdowns
- Wind speed and humidity information
- Weather icons and visual representations
- Smart caching system for optimized performance
- Hourly and daily forecast options

### User Management

- Secure user authentication with JWT
- User registration with email verification
- Digital profile with QR code generation
- Profile management with photo upload
- Passport number-based user lookup
- Comprehensive health information tracking
- Visa management with expiration notifications
- Emergency contact information
- Tourism company details management

### Security Features

- Password hashing with bcrypt
- JWT-based authentication with expiration
- Rate limiting (500 requests/5 minutes/IP)
- Secure file upload handling with validation
- Input validation and sanitization
- Helmet.js for enhanced security headers
- CORS protection
- Trust proxy configuration
- Secure password reset mechanism

### Additional Features

- Automated email notification system
- Cloud-based image storage with Cloudinary
- MongoDB database with mongoose ODM
- RESTful API architecture
- Comprehensive error handling
- Development/Production environment configuration
- Detailed logging system
- Automated visa expiration management
- Multi-language support (planned)

## Technical Architecture

### Project Structure

```
├── Controllers/     # Business logic and request handling
│   ├── authController.js
│   ├── userController.js
│   ├── weatherController.js
│   └── prayTimeController.js
├── Model/          # Database models and schemas
├── Routes/         # API route definitions
├── Middleware/     # Custom middleware functions
├── Utils/          # Utility functions and helpers
├── Templates/      # Email and profile templates
├── app.js          # Main application entry point
└── package.json    # Project dependencies
```

### Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **File Storage**: Cloudinary
- **APIs**: Tomorrow.io (Weather), Adhan.js (Prayer Times)
- **Security**: Helmet.js, CORS, Rate Limiting
- **Documentation**: Postman

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- MongoDB database
- Cloudinary account (for image storage)
- Tomorrow.io API key (for weather data)
- Gmail account (for email notifications)

## Installation

1. Clone the repository

```bash
git clone https://github.com/ADIMYY/Tawaf.git
cd Tawaf
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   Create a \`config.env\` file in the root directory:

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

4. Start the server

```bash
# Development mode
npm run start:dev

# Production mode
npm start
```

## API Documentation

Comprehensive API documentation is available on [Postman](https://documenter.getpostman.com/view/30662537/2sAYBYgVyB).

### Core Endpoints

#### Authentication (`/api/v1/auth`)

- POST `/signup` - Register new user
- POST `/login` - Authenticate user
- POST `/forgotPassword` - Initiate password reset
- POST `/verifyResetCode` - Verify reset code
- PUT `/resetpassword` - Set new password

#### Users (`/api/v1/users`)

- GET `/` - List all users (admin)
- GET `/myProfile` - Get current user profile
- PUT `/updateMyProfile` - Update user information
- DELETE `/:id` - Delete user account

#### Weather (`/api/v1/weather`)

- GET `/:lat/:lon` - Get weather information
  - Current conditions
  - Daily forecast
  - Temperature breakdowns

#### Prayer Times (`/api/v1/prayTimes`)

- GET `/:lat/:lon` - Get prayer times
  - Five daily prayers
  - Qibla direction
  - Timezone adjusted

#### Data Access (`/api/v1/get-data`)

- GET `/Qrcode` - Access QR code data
- GET `/:passport` - Lookup by passport

### Error Handling

The API implements comprehensive error handling:

- Validation errors
- Authentication errors
- Resource not found
- Server errors
- Custom error messages

### Rate Limiting

- **Limit**: 500 requests per 5 minutes
- **Per**: IP address
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining

## Development

### Running Tests

```bash
npm test
```

### Code Style

The project follows the Airbnb JavaScript Style Guide.

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Support

For support, email support@tawaafapp.com or open an issue on GitHub.

## License

This project is licensed under the ISC License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- Tomorrow.io for weather data
- Adhan.js for prayer calculations
- Cloudinary for image hosting
- MongoDB Atlas for database hosting
