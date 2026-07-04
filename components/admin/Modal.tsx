"use client";

import { X } from "lucide-react";

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ titulo, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-body text-lg font-bold text-secondary">{titulo}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
