"use client";
import { useEffect, useState } from "react";
import { Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import WebCallDialog from "../../common/components/WebCallDialog";
import { AgentRecord, CallOut } from "../../lib/api";
import { useCallsData } from "@/common/hooks/useCallsData";
import { useWebCallDialog } from "@/common/hooks/useWebCallDialog";
import { CallForm } from "@/app/calls/(components)/CallForm";
import { CallCard } from "@/app/calls/(components)/CallCard";

export default function Calls() {
  const {
    calls,
    agents,
    loading,
    error,
    form,
    submitting,
    setForm,
    load,
    onSubmit,
  } = useCallsData();

  const {
    dialogOpen,
    dialogToken,
    dialogTitle,
    closeDialog,
    openWebCallFor,
  } = useWebCallDialog();

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Calls
      </Typography>

      <CallForm
        form={form}
        agents={agents as AgentRecord[]}
        submitting={submitting}
        onChange={setForm}
        onSubmit={onSubmit}
        onReload={load}
      />

      {loading && <Typography>Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      <Stack spacing={2}>
        {calls.map((call: CallOut) => (
          <CallCard
            key={call.id}
            call={call}
            LinkComponent={Link}
            onWebCall={() => openWebCallFor(call.id)}
          />
        ))}
      </Stack>

      <WebCallDialog
        open={dialogOpen}
        onClose={closeDialog}
        accessToken={dialogToken}
        title={dialogTitle}
      />
    </Container>
  );
}
