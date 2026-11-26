"use client";

import { Search } from "lucide-react";

interface NavSearchBarProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NavSearchBar({ busqueda, setBusqueda, onSubmit }: NavSearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="relative hidden md:block w-48 lg:w-60 xl:w-72">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
        size={13}
        style={{ color: "var(--theme-header-icon, #64748B)" }}
      />
      <input
        id="top-search-input"
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar artículo... (/)"
        style={{
          backgroundColor: "var(--theme-header-input-bg, #F8FAFC)",
          borderColor: "var(--theme-header-border, #E2E8F0)",
          color: "var(--theme-header-text, #0F172A)",
        }}
        className="h-8 w-full rounded-md border pl-8 pr-12 text-xs placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300"
      />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-mono font-medium text-slate-500">
          /
        </kbd>
      </div>
    </form>
  );
}
