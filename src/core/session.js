import http from "k6/http";
import config from "../../config/environments.js";

let isLoggedIn = false;

export function authenticateVU() {
  if (isLoggedIn) {
    return;
  }

  const loginUrl = `${config.baseUrl}/api/method/login`;
  const payload = JSON.stringify({
    usr: config.loginUsr,
    pwd: config.loginPwd,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    timeout: config.timeout,
  };

  const response = http.post(loginUrl, payload, params);

  if (response.status !== 200) {
    throw new Error(
      `[LOGIN FAILED] Status: ${response.status}. Cannot authenticate VU context.`
    );
  }

  isLoggedIn = true;
}
