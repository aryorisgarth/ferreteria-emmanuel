import fs from "node:fs";
import path from "node:path";

async function main() {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.test.local"), "utf-8");
  let dbUrl = "";
  for (const line of envContent.split("\n")) {
    if (line.startsWith("DATABASE_URL=")) {
      dbUrl = line.split("=")[1].replace(/"/g, "").trim();
      break;
    }
  }

  const host = new URL(dbUrl).hostname;
  const res = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": dbUrl,
    },
    body: JSON.stringify({
      query: `
        SELECT 
          (SELECT COUNT(*) FROM oficinas) as total_oficinas,
          (SELECT COUNT(*) FROM clientes) as total_clientes,
          (SELECT COUNT(*) FROM productos) as total_productos,
          (SELECT COUNT(*) FROM facturas) as total_facturas;
      `,
    }),
  });

  const data = await res.json();
  console.log("Conteo de registros en tablas principales de emmanuel_test:", data.rows[0]);
}

main().catch(console.error);
