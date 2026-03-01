"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PGlite } from "@electric-sql/pglite";
import { 
  Play, 
  Trash2, 
  Database, 
  Layout, 
  Moon, 
  Sun, 
  ChevronRight, 
  ChevronLeft,
  Table as TableIcon,
  Columns,
  Maximize2,
  MoreVertical,
  Settings,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Initialize PGlite instance outside of the component to persist across re-renders
let dbInstance: PGlite | null = null;

const STORAGE_KEY_EDITOR = "psql_editor_content";

export default function Home() {
  const [db, setDb] = useState<PGlite | null>(null);
  const [editorValue, setEditorValue] = useState("SELECT * FROM customers;");
  const [results, setResults] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [tableContent, setTableContent] = useState<Record<string, any>>({});
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);

  // Initialize DB
  useEffect(() => {
    async function init() {
      if (!dbInstance) {
        dbInstance = new PGlite("idb://psql_editor_db");
      }
      
      await dbInstance.waitReady;
      setDb(dbInstance);

      // Load from localStorage
      const saved = localStorage.getItem(STORAGE_KEY_EDITOR);
      if (saved) {
        setEditorValue(saved);
      }

      await seedDatabase(dbInstance);
      await fetchTableMetadata(dbInstance);
    }
    init();
  }, []);

  const seedDatabase = async (pg: any) => {
    try {
      const res = await pg.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'customers'
        );
      `) as { rows: { exists: boolean }[] };

      if (!res.rows[0].exists) {
        await pg.exec(`
          CREATE TABLE customers (
              cid INT PRIMARY KEY,
              fname VARCHAR(50),
              lname VARCHAR(50),
              age INT,
              country VARCHAR(50)
          );

          INSERT INTO customers VALUES
              (1, 'John', 'Doe', 31, 'USA'),
              (2, 'Robert', 'Luna', 22, 'USA'),
              (3, 'David', 'Robinson', 22, 'UK'),
              (4, 'John', 'Reinhardt', 25, 'UK'),
              (5, 'Betty', 'Doe', 28, 'UAE'),
              (6, 'Alice', 'Walker', 30, 'Canada');

          CREATE TABLE orders (
              oid INT PRIMARY KEY,
              itm VARCHAR(50),
              amt INT,
              cid INT,
              FOREIGN KEY (cid) REFERENCES customers(cid)
          );

          INSERT INTO orders VALUES
              (1, 'Keyboard', 400, 4),
              (2, 'Mouse', 300, 4),
              (3, 'Monitor', 12000, 3),
              (4, 'Keyboard', 400, 1),
              (5, 'Mousepad', 250, 2),
              (6, 'Laptop', 45000, 1);

          CREATE TABLE shippings (
              sid INT PRIMARY KEY,
              oid INT,
              status VARCHAR(50),
              FOREIGN KEY (oid) REFERENCES orders(oid)
          );

          INSERT INTO shippings VALUES
              (1, 1, 'Pending'),
              (2, 3, 'Delivered'),
              (3, 4, 'Shipped');
        `);
        toast.success("Database seeded successfully");
      }
    } catch (err: any) {
      console.error("Error seeding database:", err);
      toast.error("Failed to seed database: " + err.message);
    }
  };

  const fetchTableMetadata = async (pg: any) => {
    try {
      const tablesRes = await pg.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
      `) as { rows: { table_name: string }[] };

      const tableData = [];
      const content: Record<string, any> = {};

      for (const row of tablesRes.rows) {
        const tableName = row.table_name;
        
        // Fetch columns
        const columnsRes = await pg.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `) as { rows: { column_name: string, data_type: string }[] };
        
        tableData.push({
          name: tableName,
          columns: columnsRes.rows
        });

        // Fetch first 5 rows for preview
        const dataRes = await pg.query(`SELECT * FROM ${tableName} LIMIT 5;`);
        content[tableName] = dataRes;
      }
      setTables(tableData);
      setTableContent(content);
    } catch (err: any) {
      console.error("Error fetching metadata:", err);
    }
  };

  const handleRunSQL = useCallback(async () => {
    if (!db || !editorValue.trim()) return;

    try {
      const script = editorValue;
      localStorage.setItem(STORAGE_KEY_EDITOR, script);
      
      const startTime = performance.now();
      const executionResults = await db.exec(script);
      const endTime = performance.now();
      
      setResults(executionResults.map(res => ({
        ...res,
        executionTime: (endTime - startTime).toFixed(2)
      })));
      
      await fetchTableMetadata(db);
      toast.success("Query executed successfully");
    } catch (err: any) {
      setResults([{ error: err.message }]);
      toast.error("Query failed: " + err.message);
    }
  }, [db, editorValue]);

  const handleClearAll = async () => {
    if (!db) return;
    if (!confirm("Are you sure you want to clear all data? This will reset the database.")) return;

    try {
      await db.exec(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
      `);
      setEditorValue("SELECT * FROM customers;");
      localStorage.removeItem(STORAGE_KEY_EDITOR);
      setResults([]);
      await seedDatabase(db);
      await fetchTableMetadata(db);
      toast.success("Database reset successful");
    } catch (err: any) {
      toast.error("Reset failed: " + err.message);
    }
  };

  // Save to localStorage on change
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY_EDITOR, editorValue);
    }, 1000);
    return () => clearTimeout(timer);
  }, [editorValue]);

  const toggleComment = useCallback(() => {
    if (!editorRef.current) return;
    const target = editorRef.current;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    const startOfLine = value.lastIndexOf("\n", start - 1) + 1;
    const endOfLine = value.indexOf("\n", end);
    const actualEnd = endOfLine === -1 ? value.length : endOfLine;

    const selectionText = value.substring(startOfLine, actualEnd);
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
      value.substring(0, startOfLine) +
      newJoinedLines +
      value.substring(actualEnd);

    setEditorValue(newValue);

    setTimeout(() => {
      target.selectionStart = startOfLine;
      target.selectionEnd = startOfLine + newJoinedLines.length;
    }, 0);
  }, [editorValue]);

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setEditorValue(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunSQL();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      toggleComment();
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">PostgreSQL Editor</h1>
          <Badge variant="secondary" className="ml-2 font-mono text-xs">PGlite</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
          <Button size="sm" onClick={handleRunSQL} className="gap-2">
            <Play className="w-4 h-4 fill-current" />
            Run SQL
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          
          {/* Left Sidebar - Table Schema */}
          <ResizablePanel 
            ref={leftPanelRef}
            defaultSize={20} 
            minSize={0} 
            collapsible={true}
            onCollapse={() => setLeftSidebarCollapsed(true)}
            onExpand={() => setLeftSidebarCollapsed(false)}
          >
            <div className="flex flex-col h-full bg-card border-r">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Schema</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleLeftSidebar}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {tables.map((table) => (
                    <div key={table.name} className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary">
                          <TableIcon className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-sm capitalize text-foreground">{table.name} [-]</span>
                      </div>
                      <div className="ml-2.5 border-l-2 border-muted pl-4 space-y-1">
                        {table.columns.map((col: any) => (
                          <div key={col.column_name} className="relative flex items-center group/item py-0.5">
                            <div className="absolute -left-4 w-4 h-px bg-muted"></div>
                            <span className="text-xs text-foreground/80">{col.column_name}</span>
                            <span className="ml-2 text-[10px] text-primary/60 font-mono">
                              [{col.data_type.toLowerCase()}]
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center - Editor and Output Area */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              {/* SQL Editor */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="flex flex-col h-full bg-muted/20">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                    <div className="flex items-center gap-2">
                      {leftSidebarCollapsed && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleLeftSidebar}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Input</span>
                    </div>
                  </div>
                  <div className="flex-1 relative font-mono text-sm">
                    <textarea
                      ref={editorRef}
                      value={editorValue}
                      onChange={(e) => setEditorValue(e.target.value)}
                      onKeyDown={handleTabKeyDown}
                      className="absolute inset-0 w-full h-full p-4 bg-transparent outline-none resize-none leading-relaxed selection:bg-primary/20"
                      placeholder="SELECT * FROM customers..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Output Section */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Output</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                      {results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                          <Layout className="w-12 h-12 mb-4" />
                          <p>Execute a query to see results</p>
                        </div>
                      )}
                      
                      {results.map((res, i) => (
                        <div key={i} className="space-y-3">
                          {res.error ? (
                            <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono">
                              Error: {res.error}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {res.rows && res.rows.length > 0 ? (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        {res.fields?.map((f: any) => (
                                          <TableHead key={f.name} className="font-mono text-xs">{f.name}</TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {res.rows.map((row: any, rowIndex: number) => (
                                        <TableRow key={rowIndex}>
                                          {res.fields?.map((f: any) => (
                                            <TableCell key={f.name} className="font-mono text-sm py-2">
                                              {row[f.name] === null ? (
                                                <span className="text-muted-foreground italic">null</span>
                                              ) : (
                                                String(row[f.name])
                                              )}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="p-3 text-sm rounded bg-muted">
                                  Query executed successfully. {res.affectedRows !== undefined && `${res.affectedRows} rows affected.`}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase">
                                <span>{res.rows?.length || 0} rows</span>
                                <span>Execution time: {res.executionTime}ms</span>
                              </div>
                              <Separator />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Sidebar - Available Tables (Data Preview) */}
          <ResizablePanel 
            ref={rightPanelRef}
            defaultSize={30} 
            minSize={0}
            collapsible={true}
            onCollapse={() => setRightSidebarCollapsed(true)}
            onExpand={() => setRightSidebarCollapsed(false)}
          >
            <div className="flex flex-col h-full bg-card border-l">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available Tables</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleRightSidebar}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-8">
                  {tables.map((table) => {
                    const data = tableContent[table.name];
                    return (
                      <div key={table.name} className="space-y-3">
                        <h3 className="text-sm font-semibold capitalize text-foreground">{table.name}</h3>
                        {data && data.rows && data.rows.length > 0 ? (
                          <div className="rounded-md border overflow-hidden">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  {data.fields.map((f: any) => (
                                    <TableHead key={f.name} className="px-2 py-1.5 h-auto font-mono text-[10px]">
                                      {f.name}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.rows.map((row: any, rowIndex: number) => (
                                  <TableRow key={rowIndex}>
                                    {data.fields.map((f: any) => (
                                      <TableCell key={f.name} className="px-2 py-1.5 font-mono text-[11px]">
                                        {String(row[f.name])}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic p-2 border rounded border-dashed">
                            Empty table
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </main>
    </div>
  );
}
