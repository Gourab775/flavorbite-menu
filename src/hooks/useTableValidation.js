import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { setTableData, getTableData, getTableId, hasValidSession, initSession } from "../utils/session";

function getTestTableNumber() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("testTable") || null;
}

function getTokenFromUrl() {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const match = path.match(/^\/[^/]+\/t\/([^/]+)/);
  return match ? match[1] : null;
}

export function useTableValidation() {
  const [tableData, setTableDataState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const testTableNumber = getTestTableNumber();
  const urlToken = getTokenFromUrl();

  const validateAndInitialize = useCallback(async () => {
    // Check if already have valid session with table
    const existingTable = getTableData();
    const hasSession = hasValidSession();
    
    // If we have a stored table and valid session, use it (skip re-validation)
    if (existingTable && hasSession && existingTable.id) {
      setTableDataState(existingTable);
      setLoading(false);
      setIsInitialized(true);
      return existingTable;
    }

    setLoading(true);
    setError(null);

    try {
      // Test mode: use testTable query param
      if (testTableNumber) {
        const { data: testTable, error: fetchError } = await supabase
          .from("restaurant_tables")
          .select("id, restaurant_id, table_number, table_token, capacity, is_active")
          .eq("table_number", `T${testTableNumber}`)
          .single();

        if (fetchError || !testTable) {
          throw new Error(`Test table T${testTableNumber} not found`);
        }

        if (!testTable.is_active) {
          throw new Error(`Test table T${testTableNumber} is not active`);
        }

        const tokenData = {
          ...testTable,
          table_token: testTable.table_token || `test-${testTable.id}`,
        };
        
        setTableDataState(tokenData);
        setTableData(tokenData);
        initSession();
        setIsInitialized(true);
        console.log(`[TEST MODE] Initialized with table T${testTableNumber}`);
        return tokenData;
      }

      // URL token mode: only validate if we have a token in URL and no stored session
      if (urlToken) {
        const { data, error: fetchError } = await supabase
          .from("restaurant_tables")
          .select("id, restaurant_id, table_number, table_token, capacity, is_active")
          .eq("table_token", urlToken)
          .single();

        if (fetchError || !data) {
          throw new Error("Invalid QR code. Table not found.");
        }

        if (!data.is_active) {
          throw new Error("This table is not active.");
        }

        setTableDataState(data);
        setTableData(data);
        initSession();
        setIsInitialized(true);
        return data;
      }

      // No token and no session - this is a direct menu access without table
      setIsInitialized(true);
      return null;
    } catch (err) {
      setError(err.message || "Failed to validate table");
      setIsInitialized(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [testTableNumber, urlToken]);

  useEffect(() => {
    // Only validate once on mount
    if (!isInitialized) {
      validateAndInitialize();
    }
  }, [isInitialized, validateAndInitialize]);

  const retry = useCallback(() => {
    setIsInitialized(false);
    setError(null);
    validateAndInitialize();
  }, [validateAndInitialize]);

  return { 
    tableData, 
    loading, 
    error, 
    retry, 
    isTestMode: !!testTableNumber,
    isInitialized 
  };
}