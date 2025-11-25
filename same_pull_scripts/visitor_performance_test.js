import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter, Gauge } from "k6/metrics";

// Custom metrics
const visitorCreationTime = new Trend("visitor_creation_time");
const apiSuccessRate = new Rate("api_success_rate");
const activeVisitors = new Gauge("active_visitors");
const totalRequests = new Counter("total_requests");
const connectionErrors = new Counter("connection_errors");

export const options = {
  stages: [
    { duration: "1s", target: 5 },
    { duration: "3s", target: 10 },
    { duration: "1s", target: 20 },
    { duration: "1s", target: 5 },
    { duration: "1s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.1"],
    checks: ["rate>0.85"],
  },
};

const BASE_URL = "http://127.0.0.1:8000";
const headers = {
  "Content-Type": "application/json",
  Authorization: "token 6781f3e727502ca:e5b0baf152d66fc",
};

export default function () {
  const testId = Math.random().toString(36).substring(7);
  const mobileNumber = `8925942${Math.floor(1000 + Math.random() * 9000)}`;

  activeVisitors.add(1);
  const success = executeVisitorFlow(testId, mobileNumber);
  apiSuccessRate.add(success);
  activeVisitors.add(-1);

  sleep(2);
}

function executeVisitorFlow(testId, mobileNumber) {
  const testData = {
    visitor_name: `Visitor-${testId}`,
    organisation_institution: `Org-${testId}`,
    image: null,
    email: `visitor${testId}@test.com`,
    mobile_number: mobileNumber,
    location: "Open Work Space 2 - IITMRP E Block",
    type_of_visit: "Meeting",
    referral_name: "EMP4_FH",
    reason: "Performance Test",
  };

  try {
    const responses = [];

    // 1. Security Login
    const loginRes = http.post(
      `${BASE_URL}/api/method/visitor_management.custom_api.entry_exit.security_login`,
      "{}",
      { headers, tags: { api: "security_login" }, timeout: "30s" }
    );
    responses.push(loginRes);
    totalRequests.add(1);

    // 2. Get Organizations
    const orgRes = http.get(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.get_org`,
      { headers, tags: { api: "get_organizations" }, timeout: "30s" }
    );
    responses.push(orgRes);
    totalRequests.add(1);

    // 3. Get Referrals
    const referralRes = http.get(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.get_referral`,
      { headers, tags: { api: "get_referrals" }, timeout: "30s" }
    );
    responses.push(referralRes);
    totalRequests.add(1);

    // 4. Generate OTP
    const otpGenRes = http.get(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.generate_and_send_otp?mobile=${mobileNumber}`,
      { headers, tags: { api: "generate_otp" }, timeout: "30s" }
    );
    responses.push(otpGenRes);
    totalRequests.add(1);

    // 5. Verify OTP
    const otpVerifyRes = http.get(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.verify_otp?mobile=${mobileNumber}&otp=341470`,
      { headers, tags: { api: "verify_otp" }, timeout: "30s" }
    );
    responses.push(otpVerifyRes);
    totalRequests.add(1);

    // 6. Create Visitor Record
    const visitorCreateStart = Date.now();
    const visitorData = { data: JSON.stringify(testData) };

    const createVisitorRes = http.post(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.create_visitor_record`,
      JSON.stringify(visitorData),
      { headers, tags: { api: "create_visitor" }, timeout: "30s" }
    );
    responses.push(createVisitorRes);
    totalRequests.add(1);

    const visitorCreateDuration = Date.now() - visitorCreateStart;
    visitorCreationTime.add(visitorCreateDuration);

    // 7. Get Visitors List
    const visitorsRes = http.get(
      `${BASE_URL}/api/method/visitor_management.custom_api.visitor.get_visitors?location=Open%20Work%20Space%202%20-%20IITMRP%20E%20Block`,
      { headers, tags: { api: "get_visitors" }, timeout: "30s" }
    );
    responses.push(visitorsRes);
    totalRequests.add(1);

    // Perform checks
    const checks = {
      "Security Login successful": loginRes.status === 200,
      "Get Organizations successful": orgRes.status === 200,
      "Get Referrals successful": referralRes.status === 200,
      "Generate OTP successful": otpGenRes.status === 200,
      "Verify OTP successful": otpVerifyRes.status === 200,
      "Create Visitor successful": createVisitorRes.status === 200,
      "Get Visitors successful": visitorsRes.status === 200,
    };

    Object.entries(checks).forEach(([name, result]) => {
      check({ [name]: result });
    });

    const allSuccessful = Object.values(checks).every(Boolean);
    if (!allSuccessful)
      console.log(`Some requests failed in iteration ${testId}`);

    return allSuccessful;
  } catch (error) {
    console.error(`Test ${testId} error: ${error.message}`);
    connectionErrors.add(1);
    return false;
  }
}

export function handleSummary(data) {
  const successRate = (data.metrics.checks.values.rate * 100).toFixed(2);
  const avgResponseTime = data.metrics.http_req_duration.values.avg.toFixed(2);

  console.log(`\n🎯 PERFORMANCE TEST RESULTS`);
  console.log(`===========================`);
  console.log(`✅ Total Iterations: ${data.metrics.iterations.values.count}`);
  console.log(`✅ Success Rate: ${successRate}%`);
  console.log(`✅ Average Response Time: ${avgResponseTime}ms`);
  console.log(`✅ Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(
    `❌ Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(
      2
    )}%`
  );

  return {
    stdout: `Performance test completed with ${data.metrics.iterations.values.count} iterations\n`,
  };
}
