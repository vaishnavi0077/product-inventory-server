import type { IncomingMessage, ServerResponse } from "node:http";
import { AppError, ValidationError } from "./errors.js";

// Maximum size of a request body: 1 MB
const MAX_BODY_SIZE = 1024 * 1024;

// Sends a JSON response to the client
export function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: unknown
): void {
  // Convert the JavaScript object into a JSON string
  const body = JSON.stringify(data);

  // Set the status code and tell the client we are sending JSON
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });

  // Send the body and finish the response
  res.end(body);
}

// Reads the request body and converts it from JSON text into an object
export async function parseBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalSize = 0;

  // The body arrives in small pieces (chunks). Collect all of them.
  for await (const chunk of req) {
    const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    totalSize += piece.length;

    // Stop if the client sends too much data
    if (totalSize > MAX_BODY_SIZE) {
      throw new AppError(413, "Request body too large");
    }

    chunks.push(piece);
  }

  // Join all the pieces and convert them into one text string
  const text = Buffer.concat(chunks).toString("utf-8").trim();

  // Nothing was sent
  if (text === "") {
    throw new ValidationError("Request body is required");
  }

  // Convert the text into a JavaScript object
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}