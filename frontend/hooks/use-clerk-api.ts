"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { setClerkTokenGetter } from "@/lib/api";

export function useClerkApi() {
  const { getToken } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only set up once to avoid re-initialization
    if (isInitialized.current) return;
    
    // Set up the Clerk token getter for the API client
    setClerkTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error("Error getting Clerk token:", error);
        return null;
      }
    });
    
    isInitialized.current = true;
  }, [getToken]);
}
