"use client";
import { useCallback, useState } from "react";
import { getCall } from "../../lib/api";

export function useWebCallDialog() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogToken, setDialogToken] = useState<string | null>(null);
  const [dialogTitle, setDialogTitle] = useState<string>("");

  const openWebCallFor = useCallback(async (callId: string) => {
    const latest = await getCall(callId);
    setDialogToken(latest.retell_call_access_token || null);
    setDialogTitle(`${latest.driver_name} — Load ${latest.load_number}`);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  return {
    dialogOpen,
    dialogToken,
    dialogTitle,
    openWebCallFor,
    closeDialog,
  };
}


