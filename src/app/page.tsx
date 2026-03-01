"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { EditorHeader } from "@/components/editor/editor-header";
import { SchemaSidebar } from "@/components/editor/schema-sidebar";
import { SQLEditor } from "@/components/editor/sql-editor";
import { ResultsView } from "@/components/editor/results-view";
import { DataPreviewSidebar } from "@/components/editor/data-preview-sidebar";
import { useHomeLogic } from "@/hooks/use-home-logic";

export default function Home() {
  const {
    tables,
    tableContent,
    results,
    resetDatabase,
    validateSQL,
    currentTemplateId,
    editorValue,
    setEditorValue,
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    leftPanelRef,
    rightPanelRef,
    handleRunSQL,
    handleTemplateChange,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebarCollapsed,
    setRightSidebarCollapsed
  } = useHomeLogic();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <EditorHeader
        onRun={handleRunSQL}
        onClear={resetDatabase}
        currentTemplateId={currentTemplateId}
        onTemplateChange={handleTemplateChange}
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
