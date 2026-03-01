"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { PGlite } from "@electric-sql/pglite";

interface PGliteContextType {
  db: PGlite | null;
  isInitializing: boolean;
  error: Error | null;
}

const PGliteContext = createContext<PGliteContextType | undefined>(undefined);

export function PGliteProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<PGlite | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let instance: PGlite | null = null;

    async function initDb() {
      try {
        // Create the instance once
        instance = new PGlite("idb://psql_editor_db");
        await instance.waitReady;
        setDb(instance);
        setIsInitializing(false);
      } catch (err) {
        console.error("Failed to initialize PGlite:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsInitializing(false);
      }
    }

    initDb();

    return () => { };
  }, []);

  return (
    <PGliteContext.Provider value={{ db, isInitializing, error }}>
      {children}
    </PGliteContext.Provider>
  );
}

export function usePGlite() {
  const context = useContext(PGliteContext);
  if (context === undefined) {
    throw new Error("usePGlite must be used within a PGliteProvider");
  }
  return context;
}
