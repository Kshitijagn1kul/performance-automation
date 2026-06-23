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
    apiKey: envValue("DEV_API_KEY"),
    apiSecret: envValue("DEV_API_SECRET"),
  },

  staging: {
    name: "Staging (QA Testing)",
    baseUrl: ENV.STAGING_BASE_URL || "http://14.99.126.171",
    apiKey: envValue("STAGING_API_KEY"),
    apiSecret: envValue("STAGING_API_SECRET"),
  },

  production: {
    name: "Production (Live)",
    baseUrl: ENV.PROD_BASE_URL || "https://erp.agnikul.in",
    apiKey: envValue("PROD_API_KEY"),
    apiSecret: envValue("PROD_API_SECRET"),
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

const rawApiKey = baseConfig.apiKey || envValue("API_KEY");
const rawApiSecret = baseConfig.apiSecret || envValue("API_SECRET");

const config = {
  ...baseConfig,
  key: selectedEnv,
  apiKey: rawApiKey ? rawApiKey.trim() : rawApiKey,
  apiSecret: rawApiSecret ? rawApiSecret.trim() : rawApiSecret,
  timeout: envValue("HTTP_TIMEOUT", "60s"),
  userAgent: envValue("USER_AGENT", "agnikul-k6-performance-framework/1.0"),
};

const missing = [];
if (!config.apiKey) missing.push("apiKey");
if (!config.apiSecret) missing.push("apiSecret");

if (missing.length > 0) {
  throw new Error(
    `[CONFIG ERROR] Missing required credentials: ${missing.join(
      ", ",
    )} for environment "${selectedEnv}"`,
  );
}

export default config;
