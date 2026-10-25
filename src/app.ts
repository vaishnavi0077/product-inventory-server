import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRoute } from "./router.js";
import { AppError } from "./utils/errors.js";
import { sendJson } from "./utils/http.js";

// This function runs for every request that comes to the server
export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // Build a URL object so we can easily get the path and the query params
    const host = req.headers.host ?? "localhost";
    const url = new URL(req.url ?? "/", `http://${host}`);

    await handleRoute(req, res, url.pathname, url.searchParams);
  } catch (error) {
    // If a response was already started, we cannot send another one
    if (res.headersSent) {
      res.end();
      return;
    }

    // Errors we created ourselves (400, 404, 405, 413)
    if (error instanceof AppError) {
      const body: { error: string; details?: string[] } = {
        error: error.message,
      };

      if (error.details) {
        body.details = error.details;
      }

      sendJson(res, error.statusCode, body);
      return;
    }

    // Bad URL encoding, for example /products/%zz
    if (error instanceof URIError) {
      sendJson(res, 400, { error: "Malformed URL" });
      return;
    }

    // Anything else is an unexpected bug.
    // Log it on the server, but do not show the details to the client.
    console.error("Unexpected error:", error);
    sendJson(res, 500, { error: "Internal server error" });
  }
}