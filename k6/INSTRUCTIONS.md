# High-Concurrency Login Test - Instructions

## 🚀 Quick Start

### Prerequisites
1. **Install k6**
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D78D77B4836D9C1307C13
   sudo echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Or use Docker
   docker pull grafana/k6
   ```

2. **Set Environment Variables**
   ```bash
   export SUPABForgecircle_URL="https://sjksibkuxvduuuvakwqx.supabase.co"
   export SUPABForgecircle_ANON_KEY="your-anon-key-here"
   # Optional: export BForgecircle_URL="same-as-supabase-url"
   ```

### Run the Test

#### Option 1: Run with Default Settings
```bash
cd /Users/ashwin/Desktop/AI\ Projects/Alumni\ Standalone/k6
k6 run high-concurrency-login-test.js
```

#### Option 2: Run with Custom Parameters
```bash
# Increase login rate
k6 run -e LOGIN_RATE=600 -e DURATION=15 high-concurrency-login-test.js

# Increase VUs for higher concurrency
k6 run -e PRE_ALLOCATED_VUS=2000 -e MAX_VUS=8000 high-concurrency-login-test.js

# Full custom configuration
k6 run \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-key \
  -e LOGIN_RATE=500 \
  -e DURATION=12 \
  -e PRE_ALLOCATED_VUS=1500 \
  -e MAX_VUS=6500 \
  high-concurrency-login-test.js
```

#### Option 3: Run with Docker
```bash
docker run -v $(pwd):/k6 -e SUPABASE_URL=$SUPABASE_URL -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY grafana/k6 run /k6/high-concurrency-login-test.js
```

---

## 📊 Understanding Results

### Real-Time Console Output

During the test, k6 prints metrics every few seconds:

```
http_req_duration..............: avg=145.23ms min=45ms med=123ms max=2.5s   p(95)=312ms p(99)=1.2s
login_duration.................: avg=234.12ms min=89ms med=198ms max=3.1s   p(95)=456ms p(99)=2.1s
login_success_rate.............: 100.00% ✓ 5400      ✗ 0
dashboard_load_time............: avg=189.45ms min=67ms med=156ms max=1.8s   p(95)=298ms p(99)=890ms
rpc_latency....................: avg=123.67ms min=34ms med=98ms max=1.2s   p(95)=234ms p(99)=567ms
vus............................: 6500    min=1500    max=6500
http_req_failed................: 0.00%   ✓ 0         ✗ 21600
```

### Key Metrics to Watch

| Metric | Threshold | Status |
|--------|-----------|--------|
| `login_duration` p(95) | < 2500ms | ✅ PASS / ❌ FAIL |
| `http_req_duration` p(95) | < 2000ms | ✅ PASS / ❌ FAIL |
| `login_success_rate` | > 90% | ✅ PASS / ❌ FAIL |
| `http_req_failed` rate | < 5% | ✅ PASS / ❌ FAIL |
| `token_extraction_failures` | < 100 | ✅ PASS / ❌ FAIL |

### Success Criteria

✅ **TEST PASSED if:**
- Login p95 < 2.5s
- Overall p95 < 2s
- Error rate < 5%
- Login success rate > 90%
- No system crashes or timeouts

❌ **TEST FAILED if:**
- Login p95 > 2.5s (authentication bottleneck)
- Error rate > 5% (system instability)
- Many 429 errors (rate limiting)
- 500 errors (server crashes)
- Connection timeouts (infrastructure limit)

---

## 🎯 Interpreting Bottlenecks

### Scenario 1: High Login Latency (> 2.5s)
**Cause:** Supabase Auth rate limiting or database connection pool exhaustion

**Solutions:**
- Check Supabase Auth logs for rate limit hits
- Increase database connection pool size
- Consider Supabase Pro for higher limits
- Implement login queuing on frontend

### Scenario 2: High Error Rate (> 5%)
**Cause:** System overwhelmed, database locks, or network issues

**Solutions:**
- Review Supabase metrics dashboard
- Check for slow queries in logs
- Implement circuit breakers
- Add database indexes for hot queries

### Scenario 3: 429 Rate Limit Errors
**Cause:** Supabase rate limits exceeded

**Solutions:**
- Request rate limit increase from Supabase
- Implement client-side request batching
- Add exponential backoff in k6 test
- Consider Supabase Pro/Enterprise

### Scenario 4: Token Extraction Failures
**Cause:** Response parsing errors or unexpected response format

**Solutions:**
- Verify Supabase Auth API version
- Check for 2FA/MFA requirements blocking auth
- Review test user credentials

---

## 📈 Output Files

After test completion, k6 generates:

```
k6/results/
├── high-concurrency-results.json     # Full detailed results
└── high-concurrency-summary.json     # Summary for CI/CD
```

Use these files for:
- Historical comparison
- CI/CD pass/fail gates
- Grafana dashboard ingestion
- Performance regression tracking

---

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Run High-Concurrency Login Test
  run: |
    cd k6
    k6 run high-concurrency-login-test.js
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    LOGIN_RATE: 450
    DURATION: 12
  continue-on-error: false  # Fail build if test fails
```

### Pass/Fail Criteria

The test automatically fails if:
- Any threshold is exceeded
- Error rate > 5%
- Critical system errors occur

---

## 🆘 Troubleshooting

### "Supabase unreachable" Error
```bash
# Verify your environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connectivity
curl -I "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"
```

### "Too many VUs" Warning
```bash
# Reduce VU count for local testing
k6 run -e PRE_ALLOCATED_VUS=500 -e MAX_VUS=2000 high-concurrency-login-test.js
```

### High Memory Usage
```bash
# Limit k6 memory
k6 run --no-thresholds high-concurrency-login-test.js

# Or reduce iteration rate
k6 run -e LOGIN_RATE=200 high-concurrency-login-test.js
```

### Test Completes Too Fast
- Check that your test users exist in Supabase Auth
- Verify credentials are correct
- Review error logs for authentication failures

---

## 🎓 Best Practices

1. **Start Small**: Run smoke test first: `k6 run smoke-test.js`
2. **Monitor Dashboard**: Watch Supabase metrics during test
3. **Off-Peak Testing**: Run during low-traffic hours
4. **Gradual Ramp-Up**: Test with 100, 1000, then 5000 users
5. **Clean Data**: Use test-specific users that can be deleted
6. **Rate Limit Awareness**: Know your Supabase tier limits
7. **Document Results**: Save results for comparison

---

## 📞 Support

If tests consistently fail:
1. Check Supabase status page: https://status.supabase.com
2. Review Supabase logs in Dashboard
3. Verify test user credentials exist
4. Check for IP-based rate limiting
5. Contact Supabase support with test metrics
