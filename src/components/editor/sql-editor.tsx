"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import type { TableMetadata } from "@/hooks/use-pglite-editor";
import { useSQLEditor } from "./use-sql-editor";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs" } });

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  showToggle: boolean;
  onToggle: () => void;
  tables?: TableMetadata[];
  validateSQL?: (sql: string) => Promise<string | null>;
}

export function SQLEditor({
  value,
  onChange,
  onRun,
  showToggle,
  onToggle,
  tables = [],
  validateSQL
}: SQLEditorProps) {
  const { theme } = useTheme();
  const { handleEditorDidMount } = useSQLEditor({ 
    value, 
    onRun, 
    tables, 
    validateSQL 
  });

  const handleEditorChange = (val: string | undefined) => {
    onChange(val || "");
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
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "var(--font-geist-mono)",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
