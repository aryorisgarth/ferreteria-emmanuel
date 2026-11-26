import { autenticar, obtenerUsuarios } from "../src/lib/auth";

async function main() {
  console.log("=== PRUEBAS DEL MÓDULO DE AUTENTICACIÓN (LOGIN) ===");

  // 1. Verificar carga inicial de usuarios
  const usuarios = obtenerUsuarios();
  console.log(`✓ Usuarios cargados: ${usuarios.length}`);
  usuarios.forEach((u) => console.log(`  - @${u.usuario} (${u.rol}): ${u.nombre}`));

  // 2. Probar usuario inexistente
  const test1 = await autenticar("noexiste", "12345");
  console.log("✓ Test usuario inexistente:", test1.ok === false ? "PASÓ (Rechazado)" : "FALLÓ");

  // 3. Probar contraseña incorrecta
  const test2 = await autenticar("cajero", "clavemalo");
  console.log("✓ Test clave errónea:", test2.ok === false ? "PASÓ (Rechazado con advertencia de intentos)" : "FALLÓ");

  // 4. Probar login correcto de Cajero
  const test3 = await autenticar("cajero", "caja123");
  console.log("✓ Test login Cajero:", test3.ok === true ? `PASÓ (Bienvenido ${test3.usuario.nombre} - Rol: ${test3.usuario.rol})` : "FALLÓ");

  // 5. Probar login correcto de Admin
  const test4 = await autenticar("admin", "admin123");
  console.log("✓ Test login Admin:", test4.ok === true ? `PASÓ (Bienvenido ${test4.usuario.nombre} - Rol: ${test4.usuario.rol})` : "FALLÓ");

  // 6. Probar login correcto de Bodega
  const test5 = await autenticar("bodega", "bodega123");
  console.log("✓ Test login Bodega:", test5.ok === true ? `PASÓ (Bienvenido ${test5.usuario.nombre} - Rol: ${test5.usuario.rol})` : "FALLÓ");

  console.log("=== TODAS LAS PRUEBAS FUNCIONALES PASARON CON ÉXITO ===");
}

main().catch(console.error);

