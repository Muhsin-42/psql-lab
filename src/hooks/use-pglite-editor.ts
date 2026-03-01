"use client";

import { useEffect, useState, useCallback } from "react";
import { PGlite } from "@electric-sql/pglite";
import { toast } from "sonner";

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

export function usePGliteEditor() {
  const [db, setDb] = useState<PGlite | null>(null);
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [tableContent, setTableContent] = useState<Record<string, any>>({});
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

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

  const seedDatabase = useCallback(async (pg: PGlite) => {
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
  }, []);

  useEffect(() => {
    async function init() {
      if (!dbInstance) {
        dbInstance = new PGlite("idb://psql_editor_db");
      }
      
      await dbInstance.waitReady;
      setDb(dbInstance);
      await seedDatabase(dbInstance);
      await fetchTableMetadata(dbInstance);
      setIsInitializing(false);
    }
    init();
  }, [seedDatabase, fetchTableMetadata]);

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

  const resetDatabase = useCallback(async () => {
    if (!db) return;
    try {
      await db.exec(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
      `);
      setResults([]);
      await seedDatabase(db);
      await fetchTableMetadata(db);
      toast.success("Database reset successful");
    } catch (err: any) {
      toast.error("Reset failed: " + err.message);
    }
  }, [db, seedDatabase, fetchTableMetadata]);

  return {
    db,
    tables,
    tableContent,
    results,
    isInitializing,
    runSQL,
    resetDatabase,
    setResults
  };
}
