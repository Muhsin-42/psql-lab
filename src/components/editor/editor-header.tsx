"use client";

import { Database, Play, Trash2, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { TEMPLATES } from "@/lib/templates";

interface EditorHeaderProps {
  onRun: () => void;
  onClear: () => void;
  currentTemplateId: string;
  onTemplateChange: (templateId: string) => void;
}

export function EditorHeader({ 
  onRun, 
  onClear, 
  currentTemplateId, 
  onTemplateChange 
}: EditorHeaderProps) {
  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data? This will reset the database.")) {
      onClear();
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
      <div className="flex items-center gap-2">
        <Database className="w-6 h-6 text-primary" />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">PostgreSQL Editor</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] h-4">PGlite</Badge>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-4 bg-muted/50 p-1 rounded-md border border-input">
          <Layout className="w-4 h-4 ml-2 text-muted-foreground" />
          <select 
            value={currentTemplateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none pr-4 py-1"
          >
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name} Template
              </option>
            ))}
          </select>
        </div>

        <ModeToggle />
        <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
        <Button size="sm" onClick={onRun} className="gap-2">
          <Play className="w-4 h-4 fill-current" />
          Run SQL
        </Button>
      </div>
    </header>
  );
}
