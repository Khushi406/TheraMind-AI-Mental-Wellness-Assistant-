# Overview

TheraMind is an emotional journaling and wellness companion application that helps users track their emotions, journal their thoughts, and improve their emotional wellbeing through AI-powered insights. The application analyzes journal entries using machine learning to identify emotions and provides personalized reflections to help users understand their mental state and emotional patterns.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a **React-based frontend** with modern tooling and component libraries:

- **Framework**: React 18 with TypeScript for type safety and better development experience
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS for utility-first styling with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a modular structure with separate pages for journaling, dashboard, and insights, along with reusable components and a chat interface for therapist-like interactions.

## Backend Architecture

The backend uses a **hybrid Python/Node.js architecture**:

- **Primary Server**: Node.js with Express.js handling routing and serving the React application
- **AI Processing Service**: Python Flask service for emotion analysis and AI-powered reflections
- **Proxy Pattern**: The Node.js server proxies API requests to the Flask service, creating a unified API interface

This approach separates concerns by using Python's rich ML ecosystem for AI processing while maintaining Node.js for web serving and database operations.

## Data Storage Solutions

**Database**: PostgreSQL with Drizzle ORM for type-safe database operations:

- **Schema Management**: Centralized schema definitions in TypeScript
- **Connection**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Migration System**: Drizzle Kit for database migrations and schema updates

**Data Models**:
- Users table with authentication credentials
- Journal entries with content, emotions analysis, reflections, and timestamps
- Relational design linking entries to users

## Authentication and Authorization

The application implements **session-based authentication**:

- User registration and login system
- Session management with secure cookie handling
- User isolation for journal entries and personal data

## External Service Integrations

**AI and Machine Learning**:
- **Hugging Face API**: Primary service for emotion analysis using pre-trained models (DistilBERT for emotion detection)
- **Anthropic Claude**: AI service for generating personalized reflections and therapeutic responses
- **Emotion Analysis**: Multi-label emotion classification with confidence scores
- **Text Generation**: Context-aware reflection generation based on emotional analysis

**Development Tools**:
- **Replit Integration**: Development environment with live reloading and error overlay
- **Font Awesome**: Icon library for enhanced UI elements
- **Google Fonts**: Nunito font family for consistent typography

The architecture prioritizes user privacy with encryption capabilities, scalable cloud infrastructure, and a modular design that separates AI processing from core application logic.