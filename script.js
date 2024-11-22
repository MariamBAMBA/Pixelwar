const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ws = new WebSocket("ws://localhost:8080");

let pageId = Math.floor(Math.random() * 100);
let username = "";
let selectedColor = "#000000";

// Gestion de la connexion
function connect() {
  const inputUsername = document.getElementById("username");
  username = inputUsername.value.trim();

  if (username) {
    document.getElementById("connection").style.display = "none";
    document.getElementById("connected-user").style.display = "block";
    document.getElementById("display-username").textContent = username;
    resetInputs();
    alert(`Connecté en tant que ${username}`);
  } else {
    alert("Veuillez entrer un pseudo !");
  }
}

// Gestion de la déconnexion
function logout() {
  username = "";

  // Réinitialiser les affichages et inputs
  document.getElementById("connection").style.display = "block";
  document.getElementById("connected-user").style.display = "none";

  resetInputs();
  alert("Vous avez été déconnecté.");
}

// Fonction pour réinitialiser tous les champs d'input
function resetInputs() {
  document.getElementById("username").value = "";
  document.getElementById("message").value = "";
  document.getElementById("color").value = "#000000";
  selectedColor = "#000000";
}

// Mise à jour de la couleur sélectionnée
document.getElementById("color").addEventListener("input", (event) => {
  selectedColor = event.target.value;
});

// Événement de clic sur le canvas
canvas.addEventListener("click", (event) => {
  if (!username) {
    alert("Vous devez être connecté pour dessiner !");
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const action = event.ctrlKey ? "erase" : "draw"; // Efface si "CTRL" est appuyé
  const color = action === "draw" ? selectedColor : "white";

  const pixelData = { action, data: { x, y, color }, id: pageId };

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(pixelData));
  } else {
    console.error("WebSocket not open:", ws.readyState);
  }
});

// Réception des messages du serveur
ws.onmessage = (event) => {
  const { action, data, username: sender } = JSON.parse(event.data);

  if (action === "draw" || action === "erase") {
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x, data.y, 10, 10);
  } else if (action === "init") {
    Object.values(data).forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 10, 10);
    });
  } else if (action === "chat") {
    displayMessage(sender, data.message);
  }
};

// Envoi de message dans le chat
function sendMessage() {
  const inputMessage = document.getElementById("message");
  const message = inputMessage.value.trim();

  if (!username) {
    alert("Vous devez être connecté pour envoyer des messages !");
    return;
  }

  if (message) {
    const chatData = { action: "chat", data: { message }, username };
    ws.send(JSON.stringify(chatData));
    inputMessage.value = "";
  }
}

// Affichage des messages dans le chat
function displayMessage(sender, message) {
  const messagesList = document.getElementById("messages");

  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <span>${sender}:</span> ${message}
    <button onclick="deleteMessage(this)">X</button>
  `;

  messagesList.appendChild(listItem);
}

// Suppression d'un message
function deleteMessage(button) {
  const listItem = button.parentElement;
  listItem.remove();
}
