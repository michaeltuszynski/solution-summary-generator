# Logging Options Examples

The `start_app.sh` script now supports flexible logging options. Here are examples of how to use them:

## Default Behavior (No screen output)
```bash
./start_app.sh
```
- Logs are written to `logs/backend.log` and `logs/frontend.log`
- No logs displayed on screen
- Services run in background
- Terminal is available for other commands

## Show All Logs on Screen
```bash
./start_app.sh --logs
```
- Shows both backend and frontend logs on screen
- Also writes to log files
- Use Ctrl+C to stop log streaming (services continue running)
- Use `./stop_app.sh` to stop all services

## Show Only Backend Logs
```bash
./start_app.sh --backend-logs
```
- Shows only backend logs on screen
- Frontend logs only written to file
- Useful for debugging backend issues

## Show Only Frontend Logs
```bash
./start_app.sh --frontend-logs
```
- Shows only frontend logs on screen
- Backend logs only written to file
- Useful for debugging React/frontend issues

## Help Information
```bash
./start_app.sh --help
# or
./start_app.sh -h
```

## Viewing Logs After Startup

If you started without screen logging, you can still view logs:

```bash
# View current log files
cat logs/backend.log
cat logs/frontend.log

# Follow logs in real-time
tail -f logs/backend.log
tail -f logs/frontend.log

# Follow both logs simultaneously
tail -f logs/backend.log logs/frontend.log
```

## Use Cases

### Development Workflow
```bash
# Start normally for regular development
./start_app.sh

# When debugging backend issues
./stop_app.sh
./start_app.sh --backend-logs

# When debugging frontend issues  
./stop_app.sh
./start_app.sh --frontend-logs

# When debugging integration issues
./stop_app.sh
./start_app.sh --logs
```

### Important Notes

1. **Services Keep Running**: When you press Ctrl+C during log streaming, only the log display stops. The services continue running.

2. **Log Files Always Created**: Regardless of screen display options, logs are always written to files.

3. **Performance**: Displaying logs on screen has minimal performance impact.

4. **Signal Handling**: The script gracefully handles interruption when streaming logs.