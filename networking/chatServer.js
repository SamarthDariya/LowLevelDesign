const net = require("net");
const os = require("os");

const PORT = 3000;
const clients = new Map(); // socket -> name

// Find your LAN IP so you know what to hand out to people
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4, not internal (not 127.0.0.1)
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

function broadcast(message, exceptSocket) {
  for (const [socket] of clients) {
    if (socket !== exceptSocket) socket.write(message);
  }
}

const server = net.createServer((socket) => {
  // socket = one client connection
  socket.write("Welcome! What's your name? ");

  let name = null;

  socket.on("data", (data) => {
    const text = data.toString().trim();

    if (!name) {
      name = text || "Anonymous";
      clients.set(socket, name);
      console.log(`[+] ${name} joined (${socket.remoteAddress})`);
      socket.write(`Hi ${name}! You're connected.\n`);
      broadcast(`* ${name} joined the chat *\n`, socket);
      return;
    }

    // A normal message
    console.log(`${name}: ${text}`);           // shows on YOUR terminal
    broadcast(`${name}: ${text}\n`, socket);   // relay to everyone else
  });

  socket.on("end", () => {
    const who = clients.get(socket);
    clients.delete(socket);
    console.log(`[-] ${who} left`);
    broadcast(`* ${who} left the chat *\n`, socket);
  });

  socket.on("error", () => clients.delete(socket));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server running.`);
  console.log(`Tell people on your network to connect to:  ${getLocalIP()}:${PORT}`);
  console.log(`Type here to send a message to everyone.\n`);
});

// YOU (the host) typing -> send to all connected clients
const HOST_NAME = "Host";
process.stdin.on("data", (data) => {
  const text = data.toString().trim();
  if (!text) return;
  console.log(`${HOST_NAME} (you): ${text}`);
  broadcast(`${HOST_NAME}: ${text}\n`); // no exceptSocket -> goes to everyone
});
