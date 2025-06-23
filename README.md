# Spirit Animal Quiz

A mystical, AI-powered spirit animal quiz that reveals your current spirit animal based on your mood and energy.

## Features

- 🎯 AI-powered personalized questions using Google Gemini
- 🔄 Dynamic results based on current mood
- 📱 Mobile-responsive design
- 🔒 Secure API key handling
- ⚡ Rate limiting and security headers
- 📊 SEO optimized

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 3. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### 4. Run the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Security Features

- **Environment Variables**: API key is stored securely in `.env` file
- **Rate Limiting**: 10 requests per 15 minutes per IP
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configured for production domain
- **Input Validation**: JSON payload size limits

## Deployment

### Environment Variables for Production
Set these environment variables on your hosting platform:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `NODE_ENV`: Set to `production`

### Recommended Hosting Platforms
- Vercel
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## File Structure

```
├── public/           # Static files (HTML, CSS, JS)
├── server.js         # Express server with API endpoints
├── package.json      # Dependencies and scripts
├── .env             # Environment variables (not in git)
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## API Endpoints

- `GET /` - Serves the main quiz application
- `POST /api/quiz` - Handles quiz interactions (rate limited)

## License

Private project - All rights reserved. 