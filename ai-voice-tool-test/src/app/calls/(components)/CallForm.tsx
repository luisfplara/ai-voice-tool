"use client";
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import { AgentRecord, CallStartRequest } from "../../../lib/api";

interface Props {
  form: CallStartRequest;
  agents: AgentRecord[];
  submitting: boolean;
  onChange: (form: CallStartRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReload: () => void;
}

export function CallForm({ form, agents, submitting, onChange, onSubmit, onReload }: Props) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Driver Name"
            fullWidth
            required
            value={form.driver_name}
            onChange={(e) => onChange({ ...form, driver_name: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Phone Number"
            fullWidth
            value={form.phone_number}
            onChange={(e) => onChange({ ...form, phone_number: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Load Number"
            fullWidth
            required
            value={form.load_number}
            onChange={(e) => onChange({ ...form, load_number: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="agent-label">Agent</InputLabel>
            <Select
              labelId="agent-label"
              label="Agent"
              value={form.agent_config_id}
              onChange={(e) => onChange({ ...form, agent_config_id: e.target.value as string })}
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
        <Button type="submit" variant="contained" disabled={submitting || !form.agent_config_id}>
          Start Test Call
        </Button>
        <Button variant="outlined" onClick={onReload}>
          Reload
        </Button>
      </Stack>
    </Box>
  );
}


