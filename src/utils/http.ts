import type { IncomingMessage, ServerResponse } from "node:http";
import { AppError, ValidationError } from "./errors.js";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: unknown
): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export async function parseBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY_BYTES) {
      throw new AppError(413, "Request body too large");
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (raw === "") {
    throw new ValidationError("Request body is required");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}