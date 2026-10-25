import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRoute } from "./router.js";
import { AppError } from "./utils/errors.js";
import { sendJson } from "./utils/http.js";

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // The base URL is only needed so `new URL` can parse a relative path
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    await handleRoute(req, res, url.pathname, url.searchParams);
  } catch (err) {
    // If a response was already started, we can't send another one
    if (res.headersSent) {
      res.end();
      return;
    }

    // Expected errors: validation (400), not found (404), 405, 413
    if (err instanceof AppError) {
      sendJson(res, err.statusCode, {
        error: err.message,
        ...(err.details && { details: err.details }),
      });
      return;
    }

    // Bad URL encoding like /products/%zz
    if (err instanceof URIError) {
      sendJson(res, 400, { error: "Malformed URL" });
      return;
    }

    // Anything else is a bug: log it, but don't leak internals to the client
    console.error("Unexpected error:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
}