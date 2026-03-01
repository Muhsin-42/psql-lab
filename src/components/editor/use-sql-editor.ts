"use client";

import { useEffect, useRef } from "react";
import type { OnMount } from "@monaco-editor/react";
import type { TableMetadata } from "@/hooks/use-pglite-editor";
import type * as monaco from "monaco-editor";

interface UseSQLEditorProps {
  value: string;
  onRun: () => void;
  tables: TableMetadata[];
  validateSQL?: (sql: string) => Promise<string | null>;
}

export function useSQLEditor({ value, onRun, tables, validateSQL }: UseSQLEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    if (!validateSQL || !editorRef.current || !monacoRef.current) return;

    const timer = setTimeout(async () => {
      if (!editorRef.current || !monacoRef.current) return;
      const error = await validateSQL(value);
      const model = editorRef.current.getModel();
      if (!model) return;

      if (error) {
        let line = 1;
        let column = 1;
        let endColumn = column + 5;
        const charMatch = error.match(/at character (\d+)/);
        
        if (charMatch) {
          // PostgreSQL character offset is 1-based, use 0-based for JS substring
          const charPos = parseInt(charMatch[1], 10) - 1;
          const textBefore = value.substring(0, charPos);
          const linesBefore = textBefore.split("\n");
          
          line = linesBefore.length;
          column = linesBefore[linesBefore.length - 1].length + 1;
          
          // Dynamically find the word at the error position to highlight it
          const wordInfo = model.getWordAtPosition({ lineNumber: line, column });
          if (wordInfo) {
            endColumn = wordInfo.endColumn;
          } else {
            endColumn = column + 5;
          }
        }

        monacoRef.current.editor.setModelMarkers(model, "sql", [
          {
            startLineNumber: line,
            startColumn: column,
            endLineNumber: line,
            endColumn: endColumn,
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

        tables.forEach((table) => {
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,
            range: range,
            detail: "Table",
          });

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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current();
    });

    return () => {
      completionProvider.dispose();
    };
  };

  return {
    handleEditorDidMount,
    editorRef
  };
}
