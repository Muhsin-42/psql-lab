"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePGliteEditor } from "@/hooks/use-pglite-editor";

import { TEMPLATES } from "@/lib/templates";

const STORAGE_KEY_EDITOR = "psql_editor_content";
const DEFAULT_QUERY = TEMPLATES.find(t => t.id === "ecommerce")?.defaultQuery || "SELECT * FROM customers;";

export function useHomeLogic() {
  const {
    tables,
    tableContent,
    results,
    runSQL,
    resetDatabase,
    validateSQL,
    setTemplate,
    currentTemplateId
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunSQL();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunSQL]);

  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId);
    
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEditorValue(template.defaultQuery);
    }
  };

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

  return {
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
  };
}
