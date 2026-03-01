"use client";

import { Layout } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { QueryResult } from "@/hooks/use-pglite-editor";

interface ResultsViewProps {
  results: QueryResult[];
}

export function ResultsView({ results }: ResultsViewProps) {
  return (
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
                    <div className="rounded-md border overflow-x-auto">
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
  );
}
