"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AgentRecord,
  CallOut,
  CallStartRequest,
  listAgents,
  listCalls,
  startCall,
} from "../../lib/api";

interface CallFormState extends CallStartRequest {}

export function useCallsData() {
  const [calls, setCalls] = useState<CallOut[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CallFormState>({
    driver_name: "",
    phone_number: "",
    load_number: "",
    agent_config_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cAll, ags] = await Promise.all([listCalls(), listAgents()]);
      setCalls(cAll);
      setAgents(ags);
      if (!form.agent_config_id && ags[0]) {
        setForm((f) => ({ ...f, agent_config_id: ags[0].id }));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [form.agent_config_id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      try {
        await startCall(form);
        await load();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setSubmitting(false);
      }
    },
    [form, load]
  );

  return {
    calls,
    agents,
    loading,
    error,
    form,
    submitting,
    setForm,
    load,
    onSubmit,
  };
}


