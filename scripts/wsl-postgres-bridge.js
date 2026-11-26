const net = require("net");
const { spawn } = require("child_process");

const server = net.createServer((socket) => {
  const p = spawn("wsl", ["nc", "127.0.0.1", "5432"], {
    stdio: ["pipe", "pipe", "ignore"],
  });

  socket.pipe(p.stdin);
  p.stdout.pipe(socket);

  socket.on("error", () => {
    try { p.kill(); } catch (_) {}
  });

  socket.on("close", () => {
    try { p.kill(); } catch (_) {}
  });

  p.on("error", () => {
    try { socket.destroy(); } catch (_) {}
  });

  p.on("close", () => {
    try { socket.end(); } catch (_) {}
  });
});

server.listen(5432, () => {
  console.log("WSL PostgreSQL TCP Bridge activo en puerto 5432 (IPv4 & IPv6)");
});

server.on("error", (err) => {
  console.error("Error en WSL PostgreSQL TCP Bridge:", err.message);
});
