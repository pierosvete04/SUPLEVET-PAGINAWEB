"use client";

import { useRef } from "react";
import { Bold, Italic, Link2, Heading2, List } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

// Editor simple basado en contentEditable + execCommand — suficiente para un
// panel interno (negrita, cursiva, links, imágenes, encabezados, listas) sin
// sumar una librería completa tipo TipTap para este alcance.
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  function ejecutar(comando: string, valor?: string) {
    document.execCommand(comando, false, valor);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function insertarLink() {
    const url = window.prompt("URL del enlace:");
    if (url) ejecutar("createLink", url);
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex gap-1 border-b border-border bg-soft-gray p-2">
        <button type="button" onClick={() => ejecutar("bold")} className="rounded p-1.5 hover:bg-white">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => ejecutar("italic")} className="rounded p-1.5 hover:bg-white">
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => ejecutar("formatBlock", "h2")}
          className="rounded p-1.5 hover:bg-white"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => ejecutar("insertUnorderedList")}
          className="rounded p-1.5 hover:bg-white"
        >
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertarLink} className="rounded p-1.5 hover:bg-white">
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-[240px] px-4 py-3 font-body text-sm text-secondary focus:outline-none [&_h2]:font-bold [&_h2]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-secondary [&_a]:underline"
      />
    </div>
  );
}
