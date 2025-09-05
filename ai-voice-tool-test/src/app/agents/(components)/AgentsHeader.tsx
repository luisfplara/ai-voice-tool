"use client";
import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export function AgentsHeader() {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Typography variant="h5">Retell Agents</Typography>
      <Button component={Link} href="/agents/new" variant="contained">New Agent</Button>
    </Stack>
  );
}


