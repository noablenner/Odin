"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiUpload } from "@/lib/api";

export function useMemory() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ doc_count: 0, chunk_count: 0, storage_bytes: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [i, s] = await Promise.all([
        apiGet(`/api/memory/items${search ? `?search=${encodeURIComponent(search)}` : ""}`),
        apiGet("/api/memory/stats"),
      ]);
      setItems(i);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadFile = async (file: File, tags: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tags", tags);
    await apiUpload("/api/memory/upload", fd);
    await refresh();
  };

  const addUrl = async (url: string, tags: string[]) => {
    await apiPost("/api/memory/url", { url, tags });
    await refresh();
  };

  const addNote = async (title: string, content: string, tags: string[]) => {
    await apiPost("/api/memory/note", { title, content, tags });
    await refresh();
  };

  const remove = async (id: string) => {
    await apiDelete(`/api/memory/items/${id}`);
    await refresh();
  };

  return { items, stats, search, setSearch, loading, refresh, uploadFile, addUrl, addNote, remove };
}
