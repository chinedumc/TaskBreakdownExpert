# TaskBreakdown Expert

An AI-powered weekly learning plan generator that creates detailed, actionable weekly breakdowns for any learning goal or project.

## Features

- 🤖 **AI-Powered Planning**: Uses OpenAI to generate detailed weekly learning plans
- 📧 **Email Export**: Send your breakdown directly to your email via Resend
- ⏱️ **Flexible Time Commitment**: Supports daily hour commitments from 1+ hours
- 📊 **Smart Duration Planning**: Handles learning plans from weeks to months
- 🔒 **Robust Error Handling**: Advanced JSON parsing with multiple fallback strategies
- 📝 **Advanced Logging**: Configurable log storage with automatic rotation and cleanup
- 🔄 **Log Rotation**: Daily and size-based log rotation (20MB threshold) with automatic cleanup
- 📊 **Analytics Tracking**: Track task breakdowns generated, emails sent, and downloads completed

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd TaskBreakdownExpert
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Visit** http://localhost:9002

## Configuration

### Required Environment Variables

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# OpenAI Model (optional, defaults to gpt-3.5-turbo)
OPENAI_MODEL=gpt-3.5-turbo

# Email Service (optional, for email export feature)
RESEND_API_KEY=your_resend_api_key_here

# Logging (optional, defaults to ./logs)
LOG_PATH=./logs
```

### Logging Configuration

By default, logs are stored in `./logs/` relative to the application. For production deployments, you can configure a custom log path with automatic rotation:

```bash
# Production example
LOG_PATH=/var/log/taskbreakdown

# User directory example
LOG_PATH=/Users/yourusername/logs/taskbreakdown

# Docker volume example
LOG_PATH=/app/logs
```

**Log Rotation Features:**
- Creates new log files daily with timestamp naming
- Rotates logs when files exceed 20MB
- Automatically cleans up logs older than 30 days
- Log files named as: `user_attempts_YYYY-MM-DD_HH-MM-SS-mmm.log`

See [docs/logging-configuration.md](docs/logging-configuration.md) for detailed logging setup.

## Documentation

- 📧 [Email Setup Guide](docs/email-setup.md) - Configure email export
- 📝 [Logging Configuration](docs/logging-configuration.md) - Configure log storage
- 🚀 [Quick Email Setup](QUICK_EMAIL_SETUP.md) - Fast email setup guide

## API Endpoints

- `POST /` - Generate learning breakdown
- `POST /api/send-email` - Send breakdown via email
- `GET /api/log-info` - View current log configuration and statistics
- `POST /api/log-cleanup` - Manual log cleanup (removes logs older than 30 days)
- `POST /api/test-log` - Test log rotation functionality
- `GET /api/analytics` - View analytics data (breakdowns, emails, downloads)
- `POST /api/track-download` - Track download events (called automatically)

## Built With

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI API** - AI-powered content generation
- **Resend** - Email delivery service
- **Zod** - Schema validation

## License

MIT License - see LICENSE file for details.
