"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Button, Card, CardContent, Container, Divider, Grid, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableRow, Typography, Alert } from '@mui/material'
import { getCall, refreshSummary, type CallOut, type TranscriptMessage } from '../../../lib/api'

export default function CallDetail() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const [call, setCall] = useState<CallOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCall(id)
      setCall(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() }, [id])

  const doRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await refreshSummary(id)
      setCall(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Call Details</Typography>
      {loading && <Typography>Loading…</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {call && (
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6">{call.driver_name}</Typography>
                <Typography variant="body2" color="text.secondary">Load {call.load_number}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography>Status: <strong>{call.status}</strong></Typography>
                <Typography>Started: {call.started_at && new Date(call.started_at).toLocaleString()}</Typography>
                <Typography>Completed: {call.completed_at && new Date(call.completed_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={load}>Reload</Button>
              <Button variant="contained" disabled={refreshing} onClick={doRefresh}>Refresh Summary</Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Structured Summary</Typography>
            {!call.summary && <Typography>No summary yet.</Typography>}
            {call.summary && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableBody>
                    {Object.entries(call.summary).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ width: 240 }}>{k}</TableCell>
                        <TableCell>{String(v)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Transcript</Typography>
            {!call.transcript?.length && <Typography>No transcript.</Typography>}
            {call.transcript?.length ? (
              <List dense>
                {call.transcript.map((m: TranscriptMessage, idx: number) => (
                  <ListItem key={idx} alignItems="flex-start">
                    <ListItemText
                      primary={<>
                        <Typography component="span" sx={{ textTransform: 'capitalize', mr: 1 }} color="text.secondary">{m.role}</Typography>
                        <Typography component="span">{m.text}</Typography>
                      </>}
                      secondary={m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            ) : null}
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
