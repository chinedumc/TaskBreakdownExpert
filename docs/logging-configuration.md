# Configurable Logging with Rotation

The TaskBreakdown Expert application now supports configurable log paths with automatic log rotation, allowing you to store logs outside the application directory with intelligent file management for better production deployments and log retention.

## Configuration

### Environment Variable

Set the `LOG_PATH` environment variable to specify where logs should be stored:

```bash
# In your .env file or environment
LOG_PATH=/path/to/your/logs
```

## Log Rotation Features

### Automatic Rotation Triggers

1. **Daily Rotation**: New log file created each day
2. **Size-based Rotation**: New log file when current file exceeds 20MB
3. **Automatic Cleanup**: Logs older than 30 days are automatically removed

### File Naming Convention

Log files follow this naming pattern:
```
user_attempts_YYYY-MM-DD_HH-MM-SS-mmm.log
```

Examples:
- `user_attempts_2025-06-29_14-30-45-123.log`
- `user_attempts_2025-06-29_18-22-10-456.log`
- `user_attempts_2025-06-30_09-15-33-789.log`

### Benefits

- **Space Management**: Prevents individual log files from becoming too large
- **Easy Navigation**: Date-based naming makes finding specific logs simple
- **Automatic Cleanup**: Prevents disk space issues from log accumulation
- **Performance**: Smaller files mean faster read/write operations
- **Analytics Tracking**: Separate analytics file tracks usage metrics

## Analytics Tracking

In addition to application logs, the system tracks usage analytics in a separate file:

### Analytics File

- **Location**: `analytics.json` in the same directory as logs
- **Purpose**: Track application usage metrics for reporting
- **Updates**: Real-time updates when events occur
- **Persistence**: Maintains counts across application restarts

### Tracked Metrics

1. **Task Breakdowns Generated**: Number of successful AI-generated breakdowns
2. **Emails Sent**: Number of learning plans sent via email
3. **Downloads Completed**: Number of PDF and text file downloads

### Analytics API Endpoints

- `GET /api/analytics` - View current analytics data
- `GET /api/log-info` - Includes analytics in the response

### Analytics File Structure

```json
{
  "taskBreakdownsGenerated": 42,
  "emailsSent": 15,
  "downloadsCompleted": 28,
  "lastUpdated": "2025-06-29T21:13:56.766Z",
  "recentTasks": [
    "Learn React and Next.js for web development",
    "Master Python for data science and machine learning",
    "Study JavaScript fundamentals and ES6+ features",
    "Build a full-stack web application with authentication"
  ]
}
```

### Task Recording
- **Recent Tasks**: Stores the last 50 task descriptions submitted
- **Purpose**: Track what types of learning goals users are requesting
- **Privacy**: API responses truncate task descriptions to 50 characters
- **Storage**: Full task descriptions stored in analytics file only

### Examples

**Development (default)**:
```bash
LOG_PATH=./logs
```

**Production server**:
```bash
LOG_PATH=/var/log/taskbreakdown
```

**User directory**:
```bash
LOG_PATH=/Users/yourusername/logs/taskbreakdown
```

**Docker container**:
```bash
LOG_PATH=/app/logs
# Mount external volume: -v /host/logs:/app/logs
```

## Implementation Details

### Automatic Directory Creation
- The application automatically creates the log directory if it doesn't exist
- Uses recursive directory creation for nested paths
- Logs directory creation attempts to console

### Path Resolution
- **Absolute paths**: Used as-is (e.g., `/var/log/taskbreakdown`)
- **Relative paths**: Resolved relative to the application root (e.g., `./logs` → `/app/logs`)
- **Default fallback**: `./logs` if `LOG_PATH` is not set

### Log Files
Currently creates:
- `user_attempts.log` - All application logs (user actions, errors, OpenAI responses)

### Error Handling
- If log directory cannot be created, error is logged to console but doesn't crash the app
- If log file cannot be written, error is logged to console but doesn't affect app functionality
- Graceful degradation ensures the application continues working even if logging fails

## Testing

### Test Log Configuration
```bash
# Test with default path
node scripts/test-log-config.js

# Test with custom path
LOG_PATH=/tmp/test-logs node scripts/test-log-config.js
```

### Check Current Configuration
Visit the API endpoint to see current log configuration:
```
GET /api/log-info
```

Response example:
```json
{
  "success": true,
  "logConfiguration": {
    "logDirectory": "/var/log/taskbreakdown",
    "logFile": "/var/log/taskbreakdown/user_attempts.log",
    "envLogPath": "/var/log/taskbreakdown"
  },
  "instructions": {
    "message": "To change log location, set LOG_PATH environment variable",
    "examples": [
      "LOG_PATH=./logs (current directory)",
      "LOG_PATH=/var/log/taskbreakdown (absolute path)",
      "LOG_PATH=/Users/username/logs/taskbreakdown (user directory)"
    ]
  }
}
```

## Production Deployment

### Docker
```dockerfile
# In your Dockerfile
ENV LOG_PATH=/app/logs

# In docker-compose.yml
volumes:
  - ./host-logs:/app/logs
```

### PM2/System Service
```bash
# Set environment variable
export LOG_PATH=/var/log/taskbreakdown

# Ensure directory exists and has proper permissions
sudo mkdir -p /var/log/taskbreakdown
sudo chown your-user:your-group /var/log/taskbreakdown

# Start the application
npm start
```

### Log Rotation
For production, consider setting up log rotation:

```bash
# /etc/logrotate.d/taskbreakdown
/var/log/taskbreakdown/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    copytruncate
}
```

## Benefits

1. **Clean Deployments**: Logs don't interfere with application updates
2. **Persistent Logs**: Logs survive application restarts and deployments
3. **Centralized Logging**: Can point to centralized log collection systems
4. **Security**: Logs can be stored in secure locations with appropriate permissions
5. **Monitoring**: External log monitoring tools can easily access log files
6. **Backup**: Logs can be backed up independently of the application

## Migration

If you have existing logs in `./logs/`, you can migrate them:

```bash
# Copy existing logs to new location
cp -r ./logs/* /your/new/log/path/

# Or move them
mv ./logs/* /your/new/log/path/
```
