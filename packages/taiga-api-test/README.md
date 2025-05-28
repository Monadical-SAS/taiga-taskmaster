# @vibe-generated

## Running Tests

### Minimal Test (One-time)
Run a simple test to verify the API is working:
```bash
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:minimal
```

### Long-Running Test (Continuous)
Run a test that calls the API every minute to verify token refresh functionality:
```bash
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:long-running
```

This will:
- Make API calls every 60 seconds
- Test different endpoints (Tasks, User Stories, Task Statuses)
- Show detailed logging of requests, responses, and token refresh
- Continue until you press Ctrl+C

## Environment Setup

Make sure you have `.env` file in the root directory with:
```
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```