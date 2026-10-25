import { createServer } from "node:http";
import { PORT } from "./config/env.js";
import { handleRequest } from "./app.js";

const server = createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Change PORT in .env.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

// Stop cleanly on Ctrl+C
process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});