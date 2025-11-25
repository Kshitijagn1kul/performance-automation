// health_check.js
import http from "k6/http";
import { check } from "k6";

export default function () {
  const responses = [
    http.get("http://127.0.0.1:3000/security_desk/visitor", { timeout: "10s" }),
    http.get(
      "http://127.0.0.1:3000/api/method/visitor_management.custom_api.visitor.get_org",
      { timeout: "10s" }
    ),
  ];

  responses.forEach((response, index) => {
    check(response, {
      [`Endpoint ${index} is accessible`]: (r) => r.status === 200,
    });

    if (response.status === 0) {
      console.log(`Connection refused for endpoint ${index}`);
    }
  });
}
