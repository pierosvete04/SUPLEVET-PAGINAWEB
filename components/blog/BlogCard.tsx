import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { BlogPost } from "@/lib/data/blog";
import { formatFechaPost } from "@/lib/data/blog";

interface BlogCardProps {
  post: BlogPost;
  productoNombre?: string;
}

export function BlogCard({ post, productoNombre }: BlogCardProps) {

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(37,60,97,0.12)]"
    >
      <div className="relative h-44 w-full overflow-hidden bg-soft-gray">
        {post.imagen_destacada ? (
          <Image
            src={post.imagen_destacada}
            alt={post.titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FileText className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {productoNombre && (
          <span className="font-impact text-xs tracking-wide text-accent">{productoNombre}</span>
        )}
        <h3 className="flex-1 font-display text-lg font-bold text-secondary">{post.titulo}</h3>
        <p className="font-body text-xs text-muted-foreground">
          {formatFechaPost(post.fecha_publicacion)}
        </p>
      </div>
    </Link>
  );
}
