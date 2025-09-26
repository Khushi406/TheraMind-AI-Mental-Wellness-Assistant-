# TheraMind Wellness 🧠💙

**An Emotional Journaling & Wellness Companion**
*Built by Khushi*

## Overview
TheraMind helps users track emotions, journal thoughts, and improve emotional wellbeing through AI-powered insights. This application combines modern web technologies with artificial intelligence to provide personalized therapeutic support.

## ✨ Features
- 📝 **Emotional Journaling** - Write daily thoughts with AI-powered emotion analysis
- 📊 **Mood Analytics** - Visual charts and trends of emotional patterns
- 🤖 **AI Therapist Chat** - Conversational AI for therapeutic support
- 📈 **Personal Insights** - Understand your emotional patterns over time
- 🔒 **Secure & Private** - Your data stays private with encryption
- 📱 **Responsive Design** - Works perfectly on all devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe UI development
- **Tailwind CSS** for modern, responsive styling
- **Shadcn/ui** for accessible, beautiful components
- **Wouter** for lightweight client-side routing
- **TanStack React Query** for server state management
- **Chart.js & Recharts** for data visualization

### Backend
- **Node.js + Express** for the main API server
- **Python Flask** for AI processing services
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **Session-based authentication** for secure user management

### AI & Analytics
- **Hugging Face API** for emotion analysis (DistilBERT model)
- **Anthropic Claude** for generating therapeutic insights
- **Real-time emotion detection** with confidence scoring

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.11 or higher)
- PostgreSQL database

### Installation

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd TheraMindWellness
   ```

2. **Install dependencies:**
   ```bash
   npm install
   pip install flask flask-cors requests python-dotenv
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   HUGGINGFACE_API_KEY="your_huggingface_token"
   ANTHROPIC_API_KEY="your_anthropic_api_key"
   SESSION_SECRET="your_random_secret_string"
   ```

4. **Initialize the database:**
   ```bash
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Your app will be running at `http://localhost:5000`

## 📁 Project Structure

```
TheraMindWellness/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.tsx        # Main app with routing
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # API utilities
├── server/                # Backend services
│   ├── index.ts          # Express server
│   ├── routes.ts         # API routes
│   ├── flask_app.py      # AI processing service
│   ├── huggingface_api.py # Emotion analysis
│   └── storage.ts        # Database operations
├── shared/               # Shared TypeScript types
└── package.json         # Project configuration
```

## 🔧 Development Commands

```bash
# Start development server (both Node.js and Flask)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check TypeScript types
npm run check

# Update database schema
npm run db:push
```

## 🎯 Key Features Explained

### Emotion Analysis Pipeline
1. User writes a journal entry
2. Text is sent to Hugging Face DistilBERT model
3. AI detects emotions (joy, sadness, anger, fear, etc.) with confidence scores
4. Results are stored and visualized for the user

### AI Therapeutic Chat
- Context-aware conversations based on journal data
- Personalized reflections using Anthropic Claude
- Therapeutic conversation patterns for emotional support

### Data Privacy & Security
- Session-based authentication
- Encrypted data storage
- User data isolation
- CORS protection for API endpoints

## 🚀 Deployment

### Environment Setup
- Set up PostgreSQL database (Neon, Supabase, etc.)
- Configure production environment variables
- Ensure Python and Node.js are available on the server

### Build & Deploy
```bash
npm run build
npm start
```

## 📈 Future Enhancements
- [ ] Mobile app version
- [ ] Advanced emotion trends analysis
- [ ] Group therapy sessions
- [ ] Integration with wearable devices
- [ ] Multi-language support

## 🤝 Contributing
Feel free to open issues and submit pull requests to improve TheraMind!

## 📄 License
This project is licensed under the MIT License.

---

**Built with ❤️ by Khushi**

*Empowering mental wellness through technology*