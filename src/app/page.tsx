"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { usePGliteEditor } from "@/hooks/use-pglite-editor";
import { EditorHeader } from "@/components/editor/editor-header";
import { SchemaSidebar } from "@/components/editor/schema-sidebar";
import { SQLEditor } from "@/components/editor/sql-editor";
import { ResultsView } from "@/components/editor/results-view";
import { DataPreviewSidebar } from "@/components/editor/data-preview-sidebar";

const STORAGE_KEY_EDITOR = "psql_editor_content";
const DEFAULT_QUERY = "SELECT * FROM customers;";

export default function Home() {
  const {
    tables,
    tableContent,
    results,
    runSQL,
    resetDatabase,
    validateSQL
  } = usePGliteEditor();

  const [editorValue, setEditorValue] = useState(DEFAULT_QUERY);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EDITOR);
    if (saved) {
      setEditorValue(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY_EDITOR, editorValue);
    }, 1000);
    return () => clearTimeout(timer);
  }, [editorValue]);

  const handleRunSQL = useCallback(() => {
    runSQL(editorValue);
  }, [runSQL, editorValue]);

  const toggleLeftSidebar = () => {
    if (leftPanelRef.current) {
      if (leftSidebarCollapsed) {
        leftPanelRef.current.expand();
      } else {
        leftPanelRef.current.collapse();
      }
      setLeftSidebarCollapsed(!leftSidebarCollapsed);
    }
  };

  const toggleRightSidebar = () => {
    if (rightPanelRef.current) {
      if (rightSidebarCollapsed) {
        rightPanelRef.current.expand();
      } else {
        rightPanelRef.current.collapse();
      }
      setRightSidebarCollapsed(!rightSidebarCollapsed);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <EditorHeader
        onRun={handleRunSQL}
        onClear={resetDatabase}
      />

      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            // @ts-expect-error - ref type mismatch with ImperativePanelHandle
            ref={leftPanelRef}
            defaultSize={20}
            minSize={0}
            collapsible={true}
            onCollapse={() => setLeftSidebarCollapsed(true)}
            onExpand={() => setLeftSidebarCollapsed(false)}
          >
            <SchemaSidebar
              tables={tables}
              onToggle={toggleLeftSidebar}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize={50} minSize={20}>
                <SQLEditor
                  value={editorValue}
                  onChange={setEditorValue}
                  onRun={handleRunSQL}
                  showToggle={leftSidebarCollapsed}
                  onToggle={toggleLeftSidebar}
                  tables={tables}
                  validateSQL={validateSQL}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={20}>
                <ResultsView results={results} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            // @ts-expect-error - ref type mismatch with ImperativePanelHandle
            ref={rightPanelRef}
            defaultSize={30}
            minSize={0}
            collapsible={true}
            onCollapse={() => setRightSidebarCollapsed(true)}
            onExpand={() => setRightSidebarCollapsed(false)}
          >
            <DataPreviewSidebar
              tables={tables}
              tableContent={tableContent}
              onToggle={toggleRightSidebar}
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </main>
    </div>
  );
}
