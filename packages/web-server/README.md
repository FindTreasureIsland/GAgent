# Gemini Web Server

This package exposes Gemini CLI backend capabilities over HTTP for web UI integration.

## Start the server

Ensure you have valid Gemini API credentials set in your environment, then:

```
cd packages/web-server
npm install
npm run build
npm start
```

Server listens on `http://localhost:3000` by default. Override with `PORT` env var.

## Endpoints

- `GET /api/health`: Health check.
- `POST /api/chat` (SSE): Streams text responses via Server-Sent Events.
- `POST /api/chat-json`: Returns a single JSON payload with the model response.

### SSE streaming with curl

```
curl -N -H "Content-Type: application/json" \
  -X POST http://localhost:3000/api/chat \
  -d '{"prompt":"用一句话解释JavaScript闭包"}'
```

The response is an SSE stream where each event has form:

```
data: {"type":"content","value":"...chunk..."}

```

### JSON response with curl

```
curl -H "Content-Type: application/json" \
  -X POST http://localhost:3000/api/chat-json \
  -d '{"prompt":"Describe Node.js event loop"}'
```

Returns a JSON string containing the formatted result.

## Enable local telemetry

To start the server with local telemetry and write logs to `telemetry.jsonl`:

```
npm run build
npm run start:telemetry
```

Then send a test request to generate routing logs:

```
curl -H "Content-Type: application/json" \
  -X POST http://localhost:3000/api/chat-json \
  -d '{"prompt":"用一句话解释JavaScript闭包"}'
```

Inspect logs (model routing decisions, reasons, latency):

```
tail -n 200 telemetry.jsonl
grep -n "decision_source" telemetry.jsonl
```

You can change the output path by editing `GEMINI_TELEMETRY_OUTFILE` in the `start:telemetry` script.

## Notes

- CORS is enabled with permissive `*` origin for development. Adjust for production.
- The server builds a fresh configuration per request to control output format.
- For SSE, use `-N` in curl to disable buffering.