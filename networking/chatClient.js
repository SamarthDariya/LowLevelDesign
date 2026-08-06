const net = require("net");

// Usage: node chatClient.js <serverIP> <port>
const host = process.argv[2] || "127.0.0.1";
const port = Number(process.argv[3]) || 3000;

const socket = net.connect(port, host, () => {
  console.log(`Connected to ${host}:${port}`);
});

// Server -> screen
socket.on("data", (data) => process.stdout.write(data.toString()));

// Keyboard -> server
process.stdin.on("data", (line) => socket.write(line));

socket.on("end", () => {
  console.log("Disconnected.");
  process.exit(0);
});
socket.on("error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});
