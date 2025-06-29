# Log Path Configuration Examples

This file contains examples of how to configure different log paths for various deployment scenarios.

## Development

Default configuration (stores logs in project directory):
```bash
LOG_PATH=./logs
```

## Production Server

Store logs in system log directory:
```bash
LOG_PATH=/var/log/taskbreakdown
```

Before starting the application, ensure the directory exists and has proper permissions:
```bash
sudo mkdir -p /var/log/taskbreakdown
sudo chown your-app-user:your-app-group /var/log/taskbreakdown
sudo chmod 755 /var/log/taskbreakdown
```

## Docker Deployment

### Option 1: Mount external volume
```bash
# docker-compose.yml
version: '3.8'
services:
  taskbreakdown:
    image: taskbreakdown:latest
    environment:
      - LOG_PATH=/app/logs
    volumes:
      - ./host-logs:/app/logs
    ports:
      - "3000:3000"
```

### Option 2: Named volume
```bash
# docker-compose.yml
version: '3.8'
services:
  taskbreakdown:
    image: taskbreakdown:latest
    environment:
      - LOG_PATH=/app/logs
    volumes:
      - taskbreakdown-logs:/app/logs
    ports:
      - "3000:3000"

volumes:
  taskbreakdown-logs:
```

## User Directory

Store logs in user's home directory:
```bash
LOG_PATH=/Users/yourusername/logs/taskbreakdown
# or
LOG_PATH=~/logs/taskbreakdown
```

## Shared Network Storage

Store logs on network-attached storage:
```bash
LOG_PATH=/mnt/shared/logs/taskbreakdown
```

## Testing Different Configurations

You can test different log paths without changing the .env file:

```bash
# Test with temporary directory
LOG_PATH=/tmp/taskbreakdown-test npm run dev

# Test with user directory
LOG_PATH=~/test-logs npm run dev

# Test with absolute path
LOG_PATH=/Users/yourusername/Desktop/test-logs npm run dev
```

## Verifying Configuration

After starting the application, you can verify the log configuration by visiting:
```
GET http://localhost:9002/api/log-info
```

This will show you:
- Current log directory path
- Log file path
- Environment variable value
- Configuration examples

## Troubleshooting

### Permission Issues
If you get permission errors, ensure the application has write access to the log directory:
```bash
# Check current permissions
ls -la /path/to/log/directory

# Fix permissions (adjust as needed)
sudo chown your-user:your-group /path/to/log/directory
sudo chmod 755 /path/to/log/directory
```

### Directory Creation Issues
The application automatically creates the log directory, but if it fails:
```bash
# Manually create the directory
mkdir -p /path/to/log/directory

# Set proper ownership
chown your-user:your-group /path/to/log/directory
```

### Path Resolution Issues
- Use absolute paths for production deployments
- Relative paths are resolved from the application root directory
- Environment variable substitution (like `~/`) is not supported - use full paths
