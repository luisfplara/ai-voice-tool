"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from "@mui/material";
import { RetellWebClient } from "retell-client-js-sdk";

type TranscriptItem = { role: "agent" | "user"; text: string; ts?: string };

export default function WebCallDialog({
  open,
  onClose,
  accessToken,
  title,
}: {
  open: boolean;
  onClose: () => void;
  accessToken: string | null;
  title?: string;
}) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const lastMessageTS = useRef<string | null>(null);
  const clientRef = useRef<RetellWebClient | null>(null);

  const start = async () => {
    if (!accessToken) return;
    setError(null);
    setConnecting(true);
    try {
      // Initialize
      const client = new RetellWebClient();
      clientRef.current = client;

      // Events
      client.on("call_started", () => {
        setIsActive(true);
      });

      client.on("call_ended", () => {
        setIsActive(false);
        stop();
      });

      client.on("agent_start_talking", () => {
        // Could show a speaking indicator
        lastMessageTS.current = new Date().toISOString();
      });

      client.on("agent_stop_talking", () => {
        // Could hide speaking indicator
        lastMessageTS.current = new Date().toISOString();
      });

      // Avoid handling raw audio here; the SDK already plays audio to the output device.

      client.on("update", (update: any) => {
        // update.transcript contains last few sentences
        // Normalize into list items for agent/user
        console.log("update->", update);
        const now = new Date().toISOString();
        if (update?.transcript?.length) {
          const items: TranscriptItem[] = [];
          for (const u of update.transcript as any[]) {
            // shape example: { role: 'agent' | 'user', content: 'text' }
            if (u.role && u.content)
              items.push({
                role: u.role,
                text: String(u.content),
                ts: now,
              });
          }
          if (items.length)setTranscript(items);
        }
      });

      client.on("error", (err: any) => {
        setError(String(err?.message || err));
        stop();
      });

      await client.startCall({
        accessToken,
        sampleRate: 24000,
        emitRawAudioSamples: false,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const stop = async () => {
    try {
      clientRef.current?.stopCall?.();
    } catch {}
    clientRef.current = null;
    setIsActive(false);
  };

  useEffect(() => {
    if (!open) {
      stop();
      setTranscript([]);
      setError(null);
      return;
    }
    if (open && accessToken) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accessToken]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title || "Web Call"}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Chip
            color={isActive ? "success" : connecting ? "warning" : "default"}
            label={isActive ? "In Call" : connecting ? "Connecting" : "Idle"}
          />
        </Stack>
        <Typography variant="subtitle1" gutterBottom>
          Live Transcript
        </Typography>
        <List dense>
          {transcript.map((t, idx) => (
            <ListItem key={idx} alignItems="flex-start">
              <ListItemText
                primary={
                  <>
                    <Typography
                      component="span"
                      sx={{ textTransform: "capitalize", mr: 1 }}
                      color={
                        t.role === "agent" ? "primary.main" : "text.secondary"
                      }
                    >
                      {t.role}
                    </Typography>
                    <Typography component="span">{t.text}</Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={stop} disabled={!isActive && !connecting}>
          Stop
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
