# TAWAAF APP

A comprehensive Islamic application built with Node.js and Express.js framework, providing prayer times, weather information, and user management features.

## Features

### Prayer Times

- Accurate prayer time calculations based on location coordinates
- Support for multiple calculation methods (Umm Al-Qura)
- Automatic timezone detection
- Formatted prayer times in 12-hour format

### Weather Information

- Real-time weather data using Tomorrow.io API
- Current weather conditions with detailed descriptions
- Temperature forecasts
- Wind speed and humidity information
- Weather icons and visual representations
- Caching system for optimized performance

### User Management

- Secure user authentication with JWT
- User registration with email verification
- Profile management with photo upload
- Passport number-based user lookup
- Health information tracking
- Visa management with expiration notifications
- QR code generation for user profiles

### Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Rate limiting for API endpoints
- Secure file upload handling
- Input validation and sanitization
- Helmet.js for enhanced security headers
- CORS protection
- Trust proxy configuration for proper IP detection

### Additional Features

- Email notifications system
- Cloudinary integration for image storage
- MongoDB database integration
- RESTful API architecture
- Error handling middleware
- Environment variable configuration
- Morgan logging in development mode
- Automatic visa expiration tracking

## Project Structure

```
├── Controllers/     # Business logic and request handling
├── Model/          # Database models and schemas
├── Routes/         # API route definitions
├── Middleware/     # Custom middleware functions
├── Utils/          # Utility functions and helpers
├── Templates/      # Email and profile templates
├── app.js          # Main application entry point
└── package.json    # Project dependencies and scripts
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- MongoDB database
- Cloudinary account (for image storage)
- Tomorrow.io API key (for weather data)

## Installation

1. Clone the repository

```bash
git clone https://github.com/ADIMYY/Tawaf.git
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   Create a `config.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
DATA_BASE=your_mongodb_connection_string
DB_PASSWORD=your_mongodb_password
JWT_SECRET_KEY=your_jwt_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
WEATHER_API_KEY=your_tomorrow_io_api_key
```

4. Start the development server

```bash
npm start
```

## API Documentation

For detailed API documentation, please visit our [Postman Documentation](https://documenter.getpostman.com/view/30662537/2sAYBYgVyB).

### Available Endpoints

#### Authentication Routes (`/api/v1/auth`)

- User registration
- User login
- Password reset
- Email verification

#### User Routes (`/api/v1/users`)

- Get all users
- Get user profile
- Update user information
- Delete user account
- Upload profile photo
- Manage visa information

#### Weather Routes (`/api/v1/weather`)

- Get current weather
- Get weather forecast
- Get hourly weather updates
- Get temperature forecasts

#### Prayer Times Routes (`/api/v1/prayTimes`)

- Get prayer times by coordinates
- Get prayer times by location
- Get prayer time calculations

#### Data Routes (`/api/v1/get-data`)

- Get user by passport number
- Get user profile information
- Get health information
- Get visa status

### API Features

- RESTful API architecture
- JWT authentication
- Rate limiting (500 requests per 5 minutes per IP)
- Error handling with detailed messages
- Response formatting
- Request validation
- File upload support
- CORS enabled

### Rate Limiting

- API requests are limited to 500 requests per 5 minutes per IP address
- Rate limit headers are included in responses
- Custom rate limit messages for exceeded requests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
