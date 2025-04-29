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

### Additional Features

- Email notifications system
- Cloudinary integration for image storage
- MongoDB database integration
- RESTful API architecture
- Error handling middleware
- CORS support
- Environment variable configuration

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
DATA_BASE=your_mongodb_connection_string
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

The API provides endpoints for:

- User authentication and management
- Prayer time calculations
- Weather information
- Profile management
- Visa tracking

[Detailed API documentation to be added]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
