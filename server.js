const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let pixels = {};

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ action: "init", data: pixels }));

  ws.on("message", (message) => {
    const { action, data, username } = JSON.parse(message);

    if (action === "draw" || action === "erase") {
      pixels[`${data.x},${data.y}`] = data;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ action, data }));
        }
      });
    } else if (action === "chat") {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ action: "chat", data, username }));
        }
      });
    }
  });
});

server.listen(8080, () => {
  console.log("Serveur WebSocket en écoute sur le port 8080");
});
