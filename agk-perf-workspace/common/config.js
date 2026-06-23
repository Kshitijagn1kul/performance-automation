const envText = open('../.env');

function parseEnv(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((env, line) => {
      const separator = line.indexOf('=');
      if (separator === -1) {
        return env;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
      return env;
    }, {});
}

const fileEnv = parseEnv(envText);

export const config = {
  baseUrl: (__ENV.URL || fileEnv.URL || '').replace(/\/$/, ''),
  apiKey: __ENV.API_KEY || fileEnv.API_KEY,
  apiSecret: __ENV.API_SECRET || fileEnv.API_SECRET,
  includeWrites: (__ENV.INCLUDE_WRITES || 'false').toLowerCase() === 'true',
  defaultSleepSeconds: Number(__ENV.SLEEP_SECONDS || '1'),
};

export function requiredConfig() {
  const missing = Object.entries({
    URL: config.baseUrl,
    API_KEY: config.apiKey,
    API_SECRET: config.apiSecret,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment value(s): ${missing.join(', ')}`);
  }

  return config;
}
