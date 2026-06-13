"use client";

import { FileText, Link2, StickyNote, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/utils";

const ICONS: Record<string, any> = { doc: FileText, url: Link2, note: StickyNote };

export function MemoryItem({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const Icon = ICONS[item.type] || FileText;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(item.created_at)} · {item.chunk_count} chunks · {formatBytes(item.byte_size)}
        </p>
        {item.tags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.tags.map((t: string) => (
              <Badge key={t} variant="muted">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Badge variant={item.status === "ready" ? "success" : item.status === "error" ? "error" : "warning"}>
        {item.status}
      </Badge>
      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
