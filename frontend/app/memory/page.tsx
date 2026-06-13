"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { UploadZone } from "@/components/memory/UploadZone";
import { MemoryItem } from "@/components/memory/MemoryItem";
import { useMemory } from "@/hooks/useMemory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";

export default function MemoryPage() {
  const { items, stats, search, setSearch, uploadFile, addUrl, addNote, remove } = useMemory();
  const [url, setUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submitUrl = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      await addUrl(url.trim(), []);
      setUrl("");
    } finally {
      setBusy(false);
    }
  };

  const submitNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) return;
    setBusy(true);
    try {
      await addNote(noteTitle.trim(), noteBody.trim(), []);
      setNoteTitle("");
      setNoteBody("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Memory</h1>
        <p className="text-sm text-muted-foreground">
          {stats.doc_count} docs · {stats.chunk_count} chunks · {formatBytes(stats.storage_bytes)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload document</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone onUpload={uploadFile} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={submitUrl} disabled={busy} className="w-full">
                Scrape & store
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write a note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button onClick={submitNote} disabled={busy} className="w-full">
                Save note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search memory…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No memory items yet. Upload a document, add a URL or write a note.
              </p>
            )}
            {items.map((item) => (
              <MemoryItem key={item.id} item={item} onDelete={remove} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
