"use client";
import { Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { CallOut } from "../../../lib/api";
import { CallStatusChip } from "./CallStatusChip";

interface Props {
  call: CallOut;
  LinkComponent: any;
  onWebCall: () => void;
}

export function CallCard({ call, LinkComponent, onWebCall }: Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1">
              {call.driver_name} — Load {call.load_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {call.status} · {call.started_at && new Date(call.started_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button component={LinkComponent} href={`/calls/${call.id}`} variant="outlined">
                Open
              </Button>
              {call.driver_status === "Not Joined" && call.status === "not_joined" && (
                <Button color="primary" variant="contained" onClick={onWebCall}>
                  Web Call
                </Button>
              )}
              <CallStatusChip status={call.driver_status || "Driving"} />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}


