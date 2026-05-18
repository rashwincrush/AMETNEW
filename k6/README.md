# k6 Performance Testing for Alumni Job Portal

## What is k6?

k6 is a modern load testing tool built for engineering teams. It uses JavaScript/ES6 syntax and can simulate thousands of concurrent virtual users to test your application's performance under load.

## Why k6 for This Project?

- **API-focused**: Perfect for testing Supabase RPC functions and REST endpoints
- **Real-world scenarios**: Simulate employer/candidate workflows
- **CI/CD ready**: Easy integration with GitHub Actions
- **Resource efficient**: Written in Go, handles thousands of VUs with minimal resources
- **Developer-friendly**: JavaScript syntax, easy to version control

## Installation

### macOS
```bash
# Using Homebrew
brew install k6

# Or using Docker
docker pull grafana/k6
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D78D77B4836D9
C1307C13
sudo echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```powershell
# Using Chocolatey
choco install k6

# Or using Docker
docker pull grafana/k6
```

## Quick Start

```bash
# Run a simple smoke test
k6 run smoke-test.js

# Run with more virtual users
k6 run --vus 100 --duration 30s load-test.js

# Run with custom environment variables
k6 run -e API_URL=https://your-api.com -e AUTH_TOKEN=your_token api-test.js
```

## Test Scenarios Included

| Test File | Purpose | Duration | Users |
|-----------|---------|----------|-------|
| `smoke-test.js` | Verify system works | 1 min | 1-5 |
| `load-test.js` | Normal load simulation | 5 min | 10-100 |
| `stress-test.js` | Find breaking point | 10 min | 100-500 |
| `spike-test.js` | Sudden traffic spikes | 3 min | 0-1000 |
| `soak-test.js` | Memory leak detection | 1 hour | 50 |
| `job-application-flow.js` | End-to-end user flow | 5 min | 20 |

## Test Environment Setup

Create a `.env` file in the k6 directory:

```bash
SUPABForgecircle_URL=https://sjksibkuxvduuuvakwqx.supabase.co
SUPABForgecircle_ANON_KEY=your-anon-key-here
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
```

## Running Tests

```bash
# 1. Navigate to k6 directory
cd /Users/ashwin/Desktop/AI\ Projects/Alumni\ Standalone/k6

# 2. Run smoke test (quick sanity check)
k6 run smoke-test.js

# 3. Run load test
k6 run load-test.js

# 4. Run with specific parameters
k6 run --vus 50 --duration 5m load-test.js

# 5. Run with Docker
docker run -v $(pwd):/k6 -i grafana/k6 run /k6/smoke-test.js

# 6. Run with environment file
k6 run --env-file .env load-test.js
```

## Interpreting Results

k6 outputs metrics in real-time:

```
http_req_duration..............: avg=234.51ms min=123ms med=210ms max=1.2s   p(95)=450ms
http_req_failed................: 0.00%  ✓ 0        ✗ 1000
http_reqs......................: 1000   33.333333/s
iteration_duration.............: avg=1.2s   min=800ms med=1.1s  max=3s     p(95)=2.1s
vus............................: 50     min=50     max=50
vus_max........................: 50     min=50     max=50
```

### Key Metrics to Watch

- **http_req_duration**: Response times (keep p95 < 500ms)
- **http_req_failed**: Error rate (should be < 1%)
- **http_reqs**: Throughput (requests per second)
- **iteration_duration**: Full user journey time

### Performance Thresholds for This Project

Based on the project requirements, set these thresholds:

| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Response Time (p95) | < 500ms | Optimize database queries |
| Error Rate | < 1% | Check Supabase limits |
| Login Time | < 2s | Review auth configuration |
| Job Search | < 300ms | Add database indexes |
| Application Submit | < 1s | Check RLS policy performance |

## CI/CD Integration

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Run nightly at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
        
      - name: Run smoke tests
        run: k6 run k6/smoke-test.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Troubleshooting

### High Error Rates
```bash
# Check if Supabase rate limiting
# Add delays between requests:
.sleep(1)  // Add 1 second delay
```

### Connection Timeouts
```bash
# Increase timeout in options:
export const options = {
  httpDebug: 'full',
  timeout: '30s',
}
```

### Memory Issues
```bash
# Reduce batch size:
export const options = {
  batch: 10,  // Max 10 parallel requests
}
```

## Best Practices

1. **Start Small**: Always run smoke tests before full load tests
2. **Use Staging**: Never run high-load tests against production
3. **Monitor Resources**: Watch Supabase dashboard during tests
4. **Clean Data**: Use test-specific data that can be deleted
5. **Rate Limiting**: Respect Supabase's rate limits (1000 req/sec default)
6. **Realistic Scenarios**: Simulate actual user behaviors, not just random requests

## Next Steps

1. Run the smoke test to verify setup: `k6 run smoke-test.js`
2. Review and customize test scenarios for your specific workflows
3. Set up CI/CD integration for automated testing
4. Monitor results and adjust thresholds based on real-world performance
