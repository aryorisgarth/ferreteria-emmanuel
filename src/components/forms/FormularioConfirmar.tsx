"use client";

import React from "react";

interface FormularioConfirmarProps {
  mensaje: string;
  action: (payload: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function FormularioConfirmar({
  mensaje,
  action,
  children,
  className = "",
}: FormularioConfirmarProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(mensaje)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
