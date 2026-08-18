"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnPickerProps<T extends string> {
  opciones: { valor: T; label: string }[];
  visibles: Set<T>;
  onToggle: (columna: T, mostrar: boolean) => void;
}

// "Dashboard personalizado": elige qué columnas de métricas ver. Se usa tal
// cual tanto en /admin/campanas-ads (todas las campañas) como en
// /admin/mi-panel/analiticas (las de un editor) — cada quien arma la suya.
export function ColumnPicker<T extends string>({ opciones, visibles, onToggle }: ColumnPickerProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="h-4 w-4" />
          Columnas ({visibles.size}/{opciones.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>Métricas a mostrar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((op) => (
          <DropdownMenuCheckboxItem
            key={op.valor}
            checked={visibles.has(op.valor)}
            onCheckedChange={(checked) => onToggle(op.valor, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {op.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
