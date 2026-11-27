"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ItemCarritoPOS } from "./tipos";

export interface TicketEnEspera {
  id: string;
  fechaHora: string;
  items: ItemCarritoPOS[];
  total: number;
  articulosCount: number;
}

const STORAGE_KEY = "fe_tickets_en_espera_pos";

export function useTicketsEnEspera() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketEnEspera[]>([]);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setTickets(JSON.parse(data));
    } catch {}
  }, []);

  const guardarEnStorage = (lista: TicketEnEspera[]) => {
    setTickets(lista);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch {}
  };

  const pausarTicket = useCallback(
    (carrito: ItemCarritoPOS[], total: number) => {
      if (carrito.length === 0) return false;
      const nuevo: TicketEnEspera = {
        id: `ticket_${Date.now()}`,
        fechaHora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        items: [...carrito],
        total,
        articulosCount: carrito.reduce((sum, it) => sum + it.cantidad, 0),
      };
      const actualizada = [nuevo, ...tickets];
      guardarEnStorage(actualizada);
      toast.exito(`Venta puesta en espera (${nuevo.articulosCount} arts).`, "Ticket en Espera");
      return true;
    },
    [tickets, toast]
  );

  const retomarTicket = useCallback(
    (id: string): ItemCarritoPOS[] | null => {
      const target = tickets.find((t) => t.id === id);
      if (!target) return null;
      guardarEnStorage(tickets.filter((t) => t.id !== id));
      toast.info(`Ticket de las ${target.fechaHora} recuperado.`, "Ticket Retomado");
      return target.items;
    },
    [tickets, toast]
  );

  const descartarTicket = useCallback(
    (id: string) => {
      guardarEnStorage(tickets.filter((t) => t.id !== id));
      toast.aviso("Ticket en espera descartado.", "Eliminado");
    },
    [tickets, toast]
  );

  return {
    tickets,
    pausarTicket,
    retomarTicket,
    descartarTicket,
  };
}
