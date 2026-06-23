/**
 * Environment configurations for Agnikul Performance Testing.
 * Supports: local, staging, production
 */

const ENV = typeof __ENV !== "undefined" ? __ENV : {};

function parseDotEnv(content) {
  const values = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) values[key] = value;
  });

  return values;
}

function loadDotEnv() {
  try {
    return parseDotEnv(open("../.env"));
  } catch (error) {
    return {};
  }
}

const DOT_ENV = loadDotEnv();

function envValue(name, fallback = null) {
  return ENV[name] || DOT_ENV[name] || fallback;
}

const ENVIRONMENTS = {
  local: {
    name: "Development (Local)",
    baseUrl: ENV.DEV_BASE_URL || "http://localhost:3000",
  },

  staging: {
    name: "Staging (QA Testing)",
    baseUrl: ENV.STAGING_BASE_URL || "http://14.99.126.171",
  },

  production: {
    name: "Production (Live)",
    baseUrl: ENV.PROD_BASE_URL || "https://erp.agnikul.in",
  },
};

const selectedEnv = envValue("ENVIRONMENT", "staging").toLowerCase();
const baseConfig = ENVIRONMENTS[selectedEnv];

if (!baseConfig) {
  throw new Error(
    `Invalid ENVIRONMENT="${selectedEnv}". Must be one of: ${Object.keys(
      ENVIRONMENTS,
    ).join(", ")}`,
  );
}

const config = {
  ...baseConfig,
  key: selectedEnv,
  loginUsr: envValue("LOGIN_USR"),
  loginPwd: envValue("LOGIN_PWD"),
  timeout: envValue("HTTP_TIMEOUT", "60s"),
  userAgent: envValue("USER_AGENT", "agnikul-k6-performance-framework/1.0"),
};

if (!config.loginUsr || !config.loginPwd) {
  throw new Error(
    "[CONFIG ERROR] Missing LOGIN_USR or LOGIN_PWD"
  );
}

export default config;
