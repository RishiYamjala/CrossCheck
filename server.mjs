import { createServer } from 'node:http';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const maxBodyBytes = 200_000;

const analysisSchema = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          description: { type: 'string' },
          systems_involved: { type: 'array', items: { type: 'string' } },
          affected: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
          recommendation: { type: 'string' },
        },
        required: ['severity', 'title', 'description', 'systems_involved', 'affected', 'evidence', 'recommendation'],
      },
    },
    summary: { type: 'string' },
    overall_status: { type: 'string' },
  },
  required: ['issues', 'summary', 'overall_status'],
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

async function readJson(req) {
  let size = 0;
  let raw = '';
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('Request data is too large.');
    raw += chunk;
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

function buildPrompt(data) {
  return `You are the Cross-System Intelligence layer for CrossCheck Me, a student portal built around PS02: “When Systems Don't Understand Each Other.”

Do not behave like a generic chatbot. Analyze the connected systems together and find relationships, conflicts, risks, fragmented-information problems, affected people/resources, evidence, and practical actions. Only use the supplied data. Do not invent policies, room availability, student counts, or facts not supported by evidence. If the data is insufficient for a claim, say so clearly.

Return ONLY valid JSON matching the requested schema. Use severity values high, medium, or low. Prefer a small number of useful issues over a long list. If no meaningful issue is supported, return an empty issues array and explain why in summary.

The required reasoning chain is: fragmented systems -> cross-system data -> Gemini analysis -> hidden connection/conflict -> impact -> recommended action.

CURRENT CROSSCHECK ME DATA:
${JSON.stringify(data, null, 2)}`;
}

function isRetryableGeminiError(error) {
  const message = String(error?.message || error);
  return error?.status === 429 || error?.status === 503 || message.includes('"code":429') || message.includes('"code":503') || message.includes('high demand');
}

async function generateWithRetry(ai, model, prompt) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseJsonSchema: analysisSchema,
        },
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function handleAnalysis(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 503, { error: 'AI analysis unavailable: GEMINI_API_KEY is not configured on the server.' });
    return;
  }
  let data;
  try {
    data = await readJson(req);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof SyntaxError ? 'Invalid JSON request.' : error.message });
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await generateWithRetry(ai, process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', buildPrompt(data));
    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    const analysis = JSON.parse(text);
    sendJson(res, 200, analysis);
  } catch (error) {
    console.error('Gemini cross-system analysis failed:', error?.message || error);
    sendJson(res, 502, { error: 'AI analysis unavailable right now. Please try again.' });
  }
}

function mimeType(path) {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json; charset=utf-8' })[extname(path).toLowerCase()] || 'application/octet-stream';
}

async function serveProduction(req, res, pathname) {
  if (pathname === '/_app/health') return sendJson(res, 200, { ok: true });
  const dist = join(root, 'dist');
  const requested = normalize(join(dist, pathname === '/' ? 'index.html' : pathname));
  const safePath = requested.startsWith(dist) ? requested : join(dist, 'index.html');
  const file = existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(dist, 'index.html');
  res.writeHead(200, { 'content-type': mimeType(file), 'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable' });
  createReadStream(file).pipe(res);
}

async function main() {
  const vite = isProduction ? null : await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'POST' && url.pathname === '/api/cross-system-analysis') return handleAnalysis(req, res);
    if (req.method === 'GET' && url.pathname === '/_app/health') return sendJson(res, 200, { ok: true });
    if (vite) return vite.middlewares(req, res, () => { if (!res.headersSent) sendJson(res, 404, { error: 'Not found' }); });
    if (req.method === 'GET') return serveProduction(req, res, url.pathname);
    sendJson(res, 405, { error: 'Method not allowed' });
  });
  server.listen(port, '0.0.0.0', () => console.log(`CrossCheck server listening on http://0.0.0.0:${port}`));
}

main().catch((error) => { console.error(error); process.exit(1); });
