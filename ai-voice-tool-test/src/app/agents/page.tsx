"use client"
import { useEffect, useState } from 'react'
import { Alert, Container, List, Typography } from '@mui/material'
import { listAgents, type AgentRecord } from '../../lib/api'
import { AgentsHeader } from './(components)/AgentsHeader'
import { AgentCard } from './(components)/AgentCard'

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
      <AgentsHeader />

      {loading && <Typography>Loading…</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && agents.length === 0 && <Typography>No agents found.</Typography>}

      <List>
        {agents.map(a => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </List>
    </Container>
  )
}
