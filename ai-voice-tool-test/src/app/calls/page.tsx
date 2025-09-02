"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AgentRecord,
  CallOut,
  listAgents,
  listCalls,
  startCall,
} from "../../lib/api";
import Link from "next/link";

import { getCall } from "../../lib/api";
import WebCallDialog from "../../components/WebCallDialog";

export default function Calls() {
  const [calls, setCalls] = useState<CallOut[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    driver_name: "",
    phone_number: "",
    load_number: "",
    agent_config_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogToken, setDialogToken] = useState<string | null>(null);
  const [dialogTitle, setDialogTitle] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cAll, ags] = await Promise.all([listCalls(), listAgents()]);
      setCalls(cAll);
      setAgents(ags);
      if (!form.agent_config_id && ags[0])
        setForm((f) => ({ ...f, agent_config_id: ags[0].id }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await startCall(form);
      console.log(result);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Calls
      </Typography>
      <Box component="form" onSubmit={onSubmit} sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Driver Name"
              fullWidth
              required
              value={form.driver_name}
              onChange={(e) =>
                setForm({ ...form, driver_name: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Phone Number"
              fullWidth
              value={form.phone_number}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Load Number"
              fullWidth
              required
              value={form.load_number}
              onChange={(e) =>
                setForm({ ...form, load_number: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="agent-label">Agent</InputLabel>
              <Select
                labelId="agent-label"
                label="Agent"
                value={form.agent_config_id}
                onChange={(e) =>
                  setForm({ ...form, agent_config_id: e.target.value })
                }
                required
              >
                {agents.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.agent_name || a.agent_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !form.agent_config_id}
          >
            Start Test Call
          </Button>
          <Button variant="outlined" onClick={load}>
            Reload
          </Button>
        </Stack>
      </Box>

      {loading && <Typography>Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      <Stack spacing={2}>
        {calls.map((call) => (
          <Card key={call.id} variant="outlined">
            <CardContent>
              <Grid container alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="subtitle1">
                    {call.driver_name} — Load {call.load_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {call.status} ·{" "}
                    {call.started_at &&
                      new Date(call.started_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      href={`/calls/${call.id}`}
                      variant="outlined"
                    >
                      Open
                    </Button>
                    <Button color="primary" variant="contained" onClick={async () => {
                      const latest = await getCall(call.id);
                      setDialogToken(latest.retell_call_access_token || null);
                      setDialogTitle(`${latest.driver_name} — Load ${latest.load_number}`);
                      setDialogOpen(true);
                    }}>Web Call</Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <WebCallDialog open={dialogOpen} onClose={() => setDialogOpen(false)} accessToken={dialogToken} title={dialogTitle} />
    </Container>
  );
}
