import { createServer } from "node:http";
import { PORT } from "./config/env.js";
import { handleRequest } from "./app.js";

// Create the server. handleRequest runs for every incoming request.
const server = createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Handle server errors, for example when the port is already used
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Change PORT in .env.`);
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});

// Stop the server cleanly when you press Ctrl+C
process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});