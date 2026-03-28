# FarmVoice AI 🌾🎤

A voice-first AI farming assistant designed specifically for blind and visually impaired farmers in South Africa. Manage livestock, get farming advice, and track vaccinations — all through voice commands and audio feedback.

## Features ✨

- **Voice-First Interface**: Fully accessible via voice commands and audio feedback
- **PIN Authentication**: Secure 4-digit PIN login
- **Livestock Management**: Add, track, and manage multiple animal categories
- **AI Assistant**: Ask farming questions powered by Google Gemini AI
- **Vaccination Tracking**: Get alerts for upcoming vaccination schedules
- **Image Recognition**: Identify animal breeds from photos
- **Offline Support**: Works offline with service worker caching
- **Data Backup**: Export and import farm data

## Tech Stack 🛠️

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Backend**: Node.js + Express
- **Storage**: Browser LocalStorage + Service Workers
- **AI**: Google Gemini 2.0 Flash API
- **Speech APIs**: Web Speech API for voice input/output

## Prerequisites 📋

- Node.js 14+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Modern browser with Speech API support (Chrome, Edge, Safari)

## Installation 🚀

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd cloud-farmvoice-ai

# Install dependencies (only dotenv is needed)
npm install dotenv
```

### 2. Configure Environment

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
PORT=8080
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
```

**Never commit `.env` to Git!** It's already in `.gitignore`.

### 3. Start the Server

```bash
# Development mode (with logging)
npm start
# or
node server.js

# Access at http://localhost:8080
```

## Usage 👨‍🌾

### Initial Setup

1. **First Visit**: Click "Create Account" or say "register"
2. **Provide Details**: Say your name, surname, and choose a 4-digit PIN
3. **Confirm**: Verify your PIN to complete registration

### Voice Commands

Available anywhere in the app:

| Command | Action |
|---------|--------|
| "menu" | Return to home screen |
| "go back" | Return to previous screen |
| "repeat" | Repeat last spoken message |
| "logout" | Exit application |

### Main Features

#### 🐄 Livestock Management
- Add animals by voice or photo
- Organize by category (cattle, goats, sheep, etc.)
- Track breeds, colors, and ages
- Add health notes

#### 🤖 AI Assistant
- Ask farming questions
- Get health advice
- Livestock management tips
- Vaccination information

#### 💉 Vaccination Tracking
- Schedule vaccinations
- Receive alerts when due
- Track vaccination history

#### 📷 Image Recognition
- Take photos of animals
- Auto-detect breed and color
- Save photo with animal profile

## API Documentation 📡

### Backend API Endpoints

#### AI Query
```
POST /api/ask
Content-Type: application/json

{
  "question": "How do I prevent foot rot in cattle?"
}

Response:
{
  "response": "Keep hooves dry and clean. Use hoof baths regularly..."
}
```

#### Image Analysis
```
POST /api/analyze-image
Content-Type: application/json

{
  "image": "base64_encoded_image_data"
}

Response:
{
  "response": "This appears to be a brown Bonsmara cow."
}
```

## Security 🔒

### Key Improvements Made

1. **API Key Protection**
   - API keys are kept in backend `.env` file
   - Frontend never exposes credentials
   - Backend proxies all API requests

2. **Input Validation**
   - All user inputs are sanitized
   - Names limited to 50 characters
   - PIN strictly validated (4 digits only)
   - HTML tags and special characters removed

3. **Data Storage**
   - PIN hashing before storage
   - No sensitive data in logs
   - LocalStorage used securely for user data

4. **Server Security**
   - CORS properly configured
   - HTTP security headers enabled
   - Request size limits (1MB max)
   - Comprehensive error logging

## Offline Support 🔌

- Service Worker caches static assets
- Works offline for all core features
- API requests show offline error gracefully
- Automatic cache updates when online

## Data Backup & Restore 💾

### Export Data
```javascript
// In browser console
const backup = FarmStorage.exportData();
FarmStorage.downloadBackup();
```

### Import Data
```javascript
// Select a backup file
const file = document.querySelector('input[type="file"]').files[0];
FarmStorage.uploadBackup(file);
```

## Browser Compatibility 🌐

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support for all APIs |
| Edge | ✅ Full | Chromium-based, full support |
| Firefox | ⚠️ Partial | Speech Recognition not supported |
| Safari | ⚠️ Partial | Limited Speech API support |
| Safari iOS | ⚠️ Limited | Some voice features unavailable |

## Testing 🧪

### Manual Testing

1. **Voice Recognition**: Say "menu" to test speech recognition
2. **API Connectivity**: Add an animal by voice to test AI
3. **Offline Mode**: Disconnect internet and try using app
4. **Backup/Restore**: Export data and import it

### Browser Console Testing
```javascript
// Check if Speech APIs are supported
VoiceEngine.init()  // Returns true/false

// Export data
console.log(FarmStorage.exportData())

// Verify PIN hashing
FarmStorage.hashPin('1234')
```

## Troubleshooting 🔧

### "Speech Recognition not supported"
- Update your browser (Speech API requires modern browser)
- Try Chrome or Edge for best compatibility
- Enable microphone permissions

### "API not configured"
- Verify `.env` file exists with `GEMINI_API_KEY`
- Restart the server after changing `.env`
- Check server logs for API key validation

### Service Worker not working
- Check browser console for errors
- Clear browser cache and reload
- Ensure HTTPS in production (required for Service Workers)

### LocalStorage full
- Export backup before clearing
- Clear old data: `FarmStorage.clearAll()`
- Consider smaller image sizes for animals

## Development 👨‍💻

### Project Structure
```
cloud-farmvoice-ai/
├── index.html              # Main app shell
├── styles.css             # Styling
├── server.js              # Backend server
├── sw.js                  # Service worker
├── .env.example           # Environment template
├── .env                   # Local config (secret)
├── .gitignore            # Git ignore rules
├── js/
│   ├── app.js            # App navigation
│   ├── auth.js           # Authentication
│   ├── storage.js        # Data persistence
│   ├── voice-engine.js   # Speech APIs
│   ├── claude-api.js     # AI integration
│   ├── livestock.js      # Livestock mgmt
│   ├── animal.js         # Animal details
│   ├── vaccine.js        # Vaccination tracking
│   ├── vision.js         # Image recognition
│   ├── home.js           # Home screen
│   └── assistant.js      # Chat interface
└── README.md
```

### Adding New Features

1. Create new `.js` file in `js/` folder
2. Add voice command handling in `VoiceEngine.checkGlobal()`
3. Add screen in `index.html`
4. Add navigation in `App.goTo()`
5. Test with browser console

### Code Standards

- Use vanilla JS (no frameworks)
- Validate all inputs
- Add try-catch for API calls
- Comment complex logic
- Test voice functionality
- Keep responses under 2 sentences

## Deployment 🌍

### Self-Hosted (Recommended for South Africa)

```bash
# Install PM2 for production
npm install -g pm2

# Start with PM2
pm2 start server.js --name "farmvoice"

# Logs
pm2 logs farmvoice

# Restart on reboot
pm2 startup
pm2 save
```

### Environment Variables for Production

```env
PORT=8080
NODE_ENV=production
GEMINI_API_KEY=your_production_key
```

### HTTPS Setup (Required for Security)

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d yourdomain.com

# Update server.js to use HTTPS
# Load certificate files and use https.createServer()
```

## Performance Tips ⚡

1. **Reduce Image Sizes**: Limit animal photos to 1MB
2. **Enable Compression**: Gzip static assets
3. **Cache Aggressively**: Service worker caches 15s by default
4. **Lazy Load**: Load animals on demand, not all at once
5. **Batch Operations**: Group animal updates together

## Accessibility ♿

- **Voice-First**: All operations can be done by voice
- **Audio Feedback**: Every action produces clear voice feedback
- **No Visuals Required**: Works with screen readers
- **Contact Information**: For accessibility issues, file an issue

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add appropriate tests
5. Submit a pull request

## License 📄

[Add your license here]

## Support & Issues 💬

- **Bug Reports**: File an issue on GitHub
- **Feature Requests**: Open a discussion
- **Questions**: Check existing issues first

## Credits 🙏

- Built with Web Speech APIs
- Powered by Google Gemini AI
- Designed for South African smallholder farmers
- Voice interaction best practices from accessibility standards

## Roadmap 🗺️

- [ ] Multi-language support (Zulu, Xhosa, Sotho)
- [ ] SMS alerts for vaccination reminders
- [ ] Integration with veterinary services
- [ ] Offline image recognition
- [ ] Community farm data sharing
- [ ] Mobile app wrapper
- [ ] WhatsApp integration

---

**Made with ❤️ for farmers who rely on their hearing**

*Last Updated: March 28, 2026*
