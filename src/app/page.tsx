import { FormularioLogin } from "@/components/auth/FormularioLogin";

export const metadata = {
  title: "Iniciar Sesión · Ferretería Emmanuel",
  description: "Portal de acceso al sistema de gestión y punto de venta de Ferretería Emmanuel.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; volver?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="min-h-dvh w-full">
      <FormularioLogin errorInicial={sp.error} volverUrl={sp.volver || "/inicio"} />
    </main>
  );
}
