"use client";

import { Table as TableIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableMetadata } from "@/hooks/use-pglite-editor";

interface SchemaSidebarProps {
  tables: TableMetadata[];
  onToggle: () => void;
}

export function SchemaSidebar({ tables, onToggle }: SchemaSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Schema</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onToggle}>
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
                <span className="font-semibold text-sm capitalize text-foreground">{table.name}</span>
              </div>
              <div className="ml-2.5 border-l-2 border-muted pl-4 space-y-1">
                {table.columns.map((col) => (
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
          {tables.length === 0 && (
            <div className="text-xs text-muted-foreground italic px-2">No tables found</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
