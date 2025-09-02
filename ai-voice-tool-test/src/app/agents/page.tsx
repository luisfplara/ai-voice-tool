"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Alert, Box, Button, Card, CardContent, Container, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { listAgents, type AgentRecord } from '../../lib/api'

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAgents()
      setAgents(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Retell Agents</Typography>
        <Button component={Link} href="/agents/new" variant="contained">New Agent</Button>
      </Stack>

      {loading && <Typography>Loading…</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && agents.length === 0 && <Typography>No agents found.</Typography>}

      <List>
        {agents.map(a => (
          <Card key={a.id} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">{a.agent_name || '(no name)'}</Typography>
                  <Typography variant="body2" color="text.secondary">{a.agent_id}</Typography>
                </Box>
                <Button component={Link} href={`/agents/${a.agent_id}`} variant="outlined">Edit</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </List>
    </Container>
  )
}
