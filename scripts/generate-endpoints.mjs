import fs from "node:fs";
import path from "node:path";

const sourcePath = process.argv[2] || "Recruitment_ v1.2.5 - Sheet1.csv";
const outputPath = process.argv[3] || "data/generated/recruitment.endpoints.json";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function slug(value, fallback) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function splitArgs(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s*\(.*?\)\s*/g, "").trim())
    .filter(Boolean);
}

function classify(endpoint, description) {
  const value = `${endpoint} ${description}`.toLowerCase();
  if (value.includes("search") || value.includes("source_candidate")) return "search";
  if (value.includes("bulk") || value.includes("processing")) return "bulk";
  if (value.includes("dashboard") || value.includes("counts") || value.includes("analytic")) return "dashboard";
  if (value.includes("candidate") || value.includes("interview") || value.includes("hired")) return "workflow";
  return "generic";
}

function normalizeEndpoint(rawEndpoint) {
  const value = rawEndpoint.trim().replace(/\s+/g, "");
  const [methodName, queryString = ""] = value.split("?");
  return {
    raw: value,
    methodName,
    queryString,
    path: `/api/method/${value}`,
  };
}

const csv = fs.readFileSync(sourcePath, "utf8");
const rows = parseCsv(csv);
let currentModule = "Uncategorized";

const endpoints = [];

for (const row of rows.slice(2)) {
  const moduleName = (row[0] || "").trim();
  const endpointCell = (row[1] || "").trim();
  const version = (row[2] || "").trim() || "v1";
  const httpMethod = (row[3] || "").trim().toUpperCase() || "GET";
  const mandatoryArgs = splitArgs(row[4] || "");
  const optionalArgs = splitArgs(row[5] || "");
  const description = (row[6] || "").trim();
  const sample = (row[7] || "").trim();

  if (moduleName) currentModule = moduleName;
  if (!endpointCell || !endpointCell.includes(".")) continue;

  const endpoint = normalizeEndpoint(endpointCell);
  const idBase = endpoint.methodName.split(".").slice(-2).join("_");

  endpoints.push({
    id: `${slug(currentModule, "module")}_${slug(idBase, `endpoint_${endpoints.length + 1}`)}`,
    application: "Recruitment Management",
    module: currentModule,
    version,
    method: httpMethod,
    endpoint: endpoint.methodName,
    path: `/api/method/${endpoint.methodName}`,
    defaultQueryString: endpoint.queryString,
    mandatoryArgs,
    optionalArgs,
    description,
    category: classify(endpoint.methodName, description),
    expectedStatus: [200],
    expectedBodyKey: "message",
    sampleAvailable: sample.length > 0,
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  source: sourcePath,
  application: "Recruitment Management",
  endpointCount: endpoints.length,
  endpoints,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(`${outputPath}.tmp`, `${JSON.stringify(output, null, 2)}\n`);
fs.renameSync(`${outputPath}.tmp`, outputPath);

console.log(`Generated ${endpoints.length} endpoints at ${outputPath}`);
