"use client";

import { useEffect, useState, useCallback } from "react";
import { PGlite } from "@electric-sql/pglite";
import { toast } from "sonner";

import { TEMPLATES } from "@/lib/templates";

// Persistent instance outside the hook
let dbInstance: PGlite | null = null;

export interface TableMetadata {
  name: string;
  columns: { column_name: string; data_type: string }[];
}

export interface QueryResult {
  rows?: any[];
  fields?: { name: string }[];
  affectedRows?: number;
  executionTime?: string;
  error?: string;
}

const STORAGE_KEY_TEMPLATE = "psql_editor_template";

export function usePGliteEditor() {
  const [db, setDb] = useState<PGlite | null>(null);
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [tableContent, setTableContent] = useState<Record<string, any>>({});
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedTemplate = localStorage.getItem(STORAGE_KEY_TEMPLATE);
      if (savedTemplate && TEMPLATES.some(t => t.id === savedTemplate)) {
        return savedTemplate;
      }
    }
    return TEMPLATES[1]?.id || "ecommerce";
  });

  const fetchTableMetadata = useCallback(async (pg: PGlite) => {
    try {
      const tablesRes = await pg.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
      `) as { rows: { table_name: string }[] };

      const tableData: TableMetadata[] = [];
      const content: Record<string, any> = {};

      for (const row of tablesRes.rows) {
        const tableName = row.table_name;
        
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

        const dataRes = await pg.query(`SELECT * FROM ${tableName} LIMIT 5;`);
        content[tableName] = dataRes;
      }
      setTables(tableData);
      setTableContent(content);
    } catch (err: any) {
      console.error("Error fetching metadata:", err);
    }
  }, []);

  const seedDatabase = useCallback(async (pg: PGlite, templateId: string = TEMPLATES[0]?.id || "ecommerce") => {
    try {
      const template = TEMPLATES.find(t => t.id === templateId);
      if (!template || !template.sql) return;

      // Check if tables already exist by checking if ANY table exists
      const res = await pg.query(`
        SELECT count(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `) as { rows: { count: string }[] };

      if (parseInt(res.rows[0].count, 10) === 0) {
        await pg.exec(template.sql);
        toast.success(`Database seeded with ${template.name} template`);
      }
    } catch (err: any) {
      console.error("Error seeding database:", err);
      toast.error("Failed to seed database: " + err.message);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!dbInstance) {
        dbInstance = new PGlite("idb://psql_editor_db");
      }
      
      await dbInstance.waitReady;
      setDb(dbInstance);
      // Try to get saved template from localStorage if you want persistence, 
      // but for now we just use default or what's in the DB.
      // If DB is empty, it will seed with default.
      await seedDatabase(dbInstance, currentTemplateId);
      await fetchTableMetadata(dbInstance);
      setIsInitializing(false);
    }
    init();
  }, [seedDatabase, fetchTableMetadata, currentTemplateId]);

  const runSQL = useCallback(async (sql: string) => {
    if (!db || !sql.trim()) return;

    try {
      const startTime = performance.now();
      const executionResults = await db.exec(sql);
      const endTime = performance.now();
      
      const formattedResults: QueryResult[] = executionResults.map(res => ({
        ...res,
        executionTime: (endTime - startTime).toFixed(2)
      }));
      
      setResults(formattedResults);
      await fetchTableMetadata(db);
      toast.success("Query executed successfully");
      return formattedResults;
    } catch (err: any) {
      const errorResult: QueryResult = { error: err.message };
      setResults([errorResult]);
      toast.error("Query failed: " + err.message);
      return [errorResult];
    }
  }, [db, fetchTableMetadata]);

  const setTemplate = useCallback(async (templateId: string) => {
    if (!db) return;
    try {
      setCurrentTemplateId(templateId);
      localStorage.setItem(STORAGE_KEY_TEMPLATE, templateId);
      await db.exec(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
      `);
      setResults([]);
      const template = TEMPLATES.find(t => t.id === templateId);
      if (template && template.sql) {
        await db.exec(template.sql);
        toast.success(`Switched to ${template.name} template`);
      } else {
        toast.success("Database cleared");
      }
      await fetchTableMetadata(db);
    } catch (err: any) {
      toast.error("Failed to switch template: " + err.message);
    }
  }, [db, fetchTableMetadata]);

  const resetDatabase = useCallback(async () => {
    if (!db) return;
    await setTemplate(currentTemplateId);
  }, [db, setTemplate, currentTemplateId]);

  const validateSQL = useCallback(async (sql: string) => {
    if (!db || !sql.trim()) return null;
    let prefixLength = 0;
    try {
      const hasMultipleStatements = sql.includes(";") && 
        sql.trim().indexOf(";") < sql.trim().length - 1;
      const isExplainable = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|VALUES)/i.test(sql);

      if (!hasMultipleStatements && isExplainable) {
        prefixLength = 8; // "EXPLAIN "
        await db.query(`EXPLAIN ${sql}`);
        return null;
      }

      const hasTransactionControl = /\b(COMMIT|ROLLBACK|BEGIN|SAVEPOINT|RELEASE)\b/i.test(sql);
      
      if (!hasTransactionControl) {
        prefixLength = 7; // "BEGIN;\n"
        await db.exec(`BEGIN;
${sql}${sql.endsWith(";") ? "" : ";"}
ROLLBACK;`);
      } else {
        const firstStatement = sql.split(";")[0];
        if (isExplainable) {
          prefixLength = 8; // "EXPLAIN "
          await db.query(`EXPLAIN ${firstStatement}`);
        }
      }
      return null;
    } catch (err: any) {
      let message = err.message;
      const charMatch = message.match(/at character (\d+)/);
      if (charMatch && prefixLength > 0) {
        const charPos = parseInt(charMatch[1], 10);
        if (charPos > prefixLength) {
          message = message.replace(`at character ${charPos}`, `at character ${charPos - prefixLength}`);
        }
      }
      return message;
    }
  }, [db]);

  return {
    db,
    tables,
    tableContent,
    results,
    isInitializing,
    runSQL,
    resetDatabase,
    validateSQL,
    setResults,
    setTemplate,
    currentTemplateId
  };
}
