"use client";

import { Database, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";

interface EditorHeaderProps {
  onRun: () => void;
  onClear: () => void;
}

export function EditorHeader({ onRun, onClear }: EditorHeaderProps) {
  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data? This will reset the database.")) {
      onClear();
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
      <div className="flex items-center gap-2">
        <Database className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">PostgreSQL Editor</h1>
        <Badge variant="secondary" className="ml-2 font-mono text-xs">PGlite</Badge>
      </div>
      
      <div className="flex items-center gap-3">
        <ModeToggle />
        <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
          <Trash2 className="w-4 h-4" />
          Clear All
        </Button>
        <Button size="sm" onClick={onRun} className="gap-2">
          <Play className="w-4 h-4 fill-current" />
          Run SQL
        </Button>
      </div>
    </header>
  );
}
