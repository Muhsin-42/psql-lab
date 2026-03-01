"use client";

import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import type { TableMetadata } from "@/hooks/use-pglite-editor";
import type * as monaco from "monaco-editor";

// Pre-load monaco to avoid flickering
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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const { theme } = useTheme();

  // Debounced linting
  useEffect(() => {
    if (!validateSQL || !editorRef.current || !monacoRef.current) return;

    const timer = setTimeout(async () => {
      if (!editorRef.current || !monacoRef.current) return;
      const error = await validateSQL(value);
      const model = editorRef.current.getModel();
      if (!model) return;
      
      if (error) {
        // Simple error parsing to find line/column if possible
        // Postgres errors often look like "syntax error at or near \"foo\" at character 15"
        let line = 1;
        let column = 1;
        const charMatch = error.match(/at character (\d+)/);
        if (charMatch) {
          const charPos = parseInt(charMatch[1], 10);
          const textBefore = value.substring(0, charPos);
          const linesBefore = textBefore.split("\n");
          line = linesBefore.length;
          column = linesBefore[linesBefore.length - 1].length + 1;
        }

        monacoRef.current.editor.setModelMarkers(model, "sql", [
          {
            startLineNumber: line,
            startColumn: column,
            endLineNumber: line,
            endColumn: column + 5, // highlight a few chars
            message: error,
            severity: monacoRef.current.MarkerSeverity.Error,
          },
        ]);
      } else {
        monacoRef.current.editor.setModelMarkers(model, "sql", []);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, validateSQL]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register completion provider for SQL
    const completionProvider = monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: ["."],
      provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [];

        // Add table names
        tables.forEach((table) => {
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,
            range: range,
            detail: "Table",
          });

          // Add column names
          table.columns.forEach((col) => {
            suggestions.push({
              label: col.column_name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.column_name,
              range: range,
              detail: `${table.name} column (${col.data_type})`,
            });
          });
        });

        // Add some common SQL keywords if not already there
        const keywords = [
          "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", 
          "CREATE", "DROP", "ALTER", "TABLE", "INTO", "VALUES",
          "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON",
          "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET",
          "AND", "OR", "NOT", "NULL", "IS", "IN", "EXISTS",
          "BETWEEN", "LIKE", "AS", "DISTINCT", "COUNT", "SUM",
          "AVG", "MIN", "MAX", "CASE", "WHEN", "THEN", "ELSE", "END"
        ];

        keywords.forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range: range,
          });
        });

        return { suggestions };
      },
    });

    // Add command for Run SQL (Ctrl/Cmd + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Clean up
    return () => {
      completionProvider.dispose();
    };
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
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
