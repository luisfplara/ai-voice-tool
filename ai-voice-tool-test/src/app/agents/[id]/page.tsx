"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Alert, Box, Button, Checkbox, Container, FormControlLabel, Grid, Stack, TextField, Typography, Card, CardContent } from '@mui/material'
import { createAgent, getAgent, updateAgent, type RetellAgent } from '../../../lib/api'

const editableFields = [
  'agent_name',
  'voice_id',
  'voice_speed',
  'voice_temperature',
  'enable_backchannel',
] as const

export default function AgentEdit() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string | undefined
  const router = useRouter()
  const [agent, setAgent] = useState<RetellAgent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || id === 'new') {
      setAgent({ agent_id: '', agent_name: '', voice_id: '' })
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const data = await getAgent(id)
        setAgent(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const isNew = !id || id === 'new'
      if (isNew) {
        const name = (agent?.agent_name || '').trim() || undefined
        const voice = (agent?.voice_id || '').trim() || undefined
        await createAgent({ agent_name: name, voice_id: voice })
      } else {
        const body: Record<string, unknown> = {}
        if (agent) {
          for (const key of editableFields) body[key] = (agent as any)[key]
        }
        await updateAgent(id, body)
      }
      router.push('/agents')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const setField = (key: typeof editableFields[number], value: unknown) =>
    setAgent(prev => (prev ? { ...prev, [key]: value } as RetellAgent : prev))

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>{id === 'new' ? 'Create Retell Agent' : 'Edit Retell Agent'}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Typography>Loading…</Typography>}
      {agent && (
        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={onSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Agent Name" fullWidth value={String(agent.agent_name || '')} onChange={e => setField('agent_name', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Voice ID" fullWidth value={String(agent.voice_id || '')} onChange={e => setField('voice_id', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Voice Speed" type="number" inputProps={{ step: 0.05 }} fullWidth value={Number(agent.voice_speed ?? 1)} onChange={e => setField('voice_speed', Number(e.target.value))} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Voice Temperature" type="number" inputProps={{ step: 0.05 }} fullWidth value={Number(agent.voice_temperature ?? 1)} onChange={e => setField('voice_temperature', Number(e.target.value))} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel control={<Checkbox checked={Boolean(agent.enable_backchannel)} onChange={e => setField('enable_backchannel', e.target.checked)} />} label="Enable Backchannel" />
                </Grid>
              </Grid>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" disabled={loading}>{id === 'new' ? 'Create' : 'Save'}</Button>
                <Button variant="outlined" onClick={() => router.push('/agents')}>Cancel</Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
