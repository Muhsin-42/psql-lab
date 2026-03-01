"use client";

import { useCallback, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  showToggle: boolean;
  onToggle: () => void;
}

export function SQLEditor({ value, onChange, onRun, showToggle, onToggle }: SQLEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const toggleComment = useCallback(() => {
    if (!editorRef.current) return;
    const target = editorRef.current;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const val = target.value;

    const startOfLine = val.lastIndexOf("\n", start - 1) + 1;
    const endOfLine = val.indexOf("\n", end);
    const actualEnd = endOfLine === -1 ? val.length : endOfLine;

    const selectionText = val.substring(startOfLine, actualEnd);
    const lines = selectionText.split("\n");

    const allCommented = lines.every(
      (line) => line.trim().startsWith("--") || line.trim() === "",
    );

    let newLines;
    if (allCommented) {
      newLines = lines.map((line) => line.replace(/(--\s?)/, ""));
    } else {
      newLines = lines.map((line) => `-- ${line}`);
    }

    const newJoinedLines = newLines.join("\n");
    const newValue = 
      val.substring(0, startOfLine) +
      newJoinedLines +
      val.substring(actualEnd);

    onChange(newValue);

    setTimeout(() => {
      target.selectionStart = startOfLine;
      target.selectionEnd = startOfLine + newJoinedLines.length;
    }, 0);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      toggleComment();
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          {showToggle && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onToggle}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Input</span>
        </div>
      </div>
      <div className="flex-1 relative font-mono text-sm">
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 bg-transparent outline-none resize-none leading-relaxed selection:bg-primary/20"
          placeholder="SELECT * FROM customers..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
