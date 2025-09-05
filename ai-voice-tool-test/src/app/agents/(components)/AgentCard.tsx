"use client";
import { Button, Card, CardContent, Stack, Typography, Box } from "@mui/material";
import Link from "next/link";
import { AgentRecord } from "../../../lib/api";

export function AgentCard({ agent }: { agent: AgentRecord }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1">{agent.agent_name || '(no name)'}</Typography>
            <Typography variant="body2" color="text.secondary">{agent.agent_id}</Typography>
          </Box>
          <Button component={Link} href={`/agents/${agent.agent_id}`} variant="outlined">Edit</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}


