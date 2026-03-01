"use client";

import { Layout, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { TableMetadata } from "@/hooks/use-pglite-editor";

interface DataPreviewSidebarProps {
  tables: TableMetadata[];
  tableContent: Record<string, any>;
  onToggle: () => void;
}

export function DataPreviewSidebar({ tables, tableContent, onToggle }: DataPreviewSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-card border-l">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available Tables</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onToggle}>
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
          {tables.length === 0 && (
            <div className="text-sm text-muted-foreground italic text-center py-10">
              No data to preview
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
