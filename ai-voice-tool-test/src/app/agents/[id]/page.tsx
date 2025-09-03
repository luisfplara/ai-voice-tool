"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import {
  createAgent,
  getAgent,
  updateAgent,
  getConversationFlow,
  updateConversationFlow,
  type RetellAgent,
  type ConversationFlow,
  type ConversationFlowNode,
} from "../../../lib/api";

const editableFields = [
  "agent_name",
  "voice_id",
  "voice_speed",
  "voice_temperature",
  "enable_backchannel",
  // Audio & transcription primitives
  "language",
  "stt_mode",
  "vocab_specialization",
  "denoising_mode",
  "volume",
  "ambient_sound",
  "ambient_sound_volume",
  "interruption_sensitivity",
  "responsiveness",
  "backchannel_frequency",
  "reminder_max_count",
  "reminder_trigger_ms",
] as const;

export default function AgentEdit() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [agent, setAgent] = useState<RetellAgent | null>(null);
  const [flow, setFlow] = useState<ConversationFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedJson, setAdvancedJson] = useState<string>("{}");
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [boostedKeywordsText, setBoostedKeywordsText] = useState<string>("");
  const [pronunciationDictionaryJson, setPronunciationDictionaryJson] =
    useState<string>("");
  const [piiConfigJson, setPiiConfigJson] = useState<string>("");

  useEffect(() => {
    if (!id || id === "new") {
      setAgent({ agent_id: "", agent_name: "", voice_id: "" });
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAgent(id);
        setAgent(data);
        // Populate derived text fields
        const bk = Array.isArray((data as any)?.boosted_keywords)
          ? ((data as any).boosted_keywords as unknown[])
              .map((v) => String(v))
              .join(", ")
          : "";
        setBoostedKeywordsText(bk);
        const pd = (data as any)?.pronunciation_dictionary;
        setPronunciationDictionaryJson(pd ? JSON.stringify(pd, null, 2) : "");
        const pii = (data as any)?.pii_config;
        setPiiConfigJson(pii ? JSON.stringify(pii, null, 2) : "");
        setAdvancedJson((prev) => (prev?.trim() ? prev : "{}"));
        const flowId = (data?.response_engine as any)?.conversation_flow_id as
          | string
          | undefined;
        if (flowId) {
          setFlowLoading(true);
          setFlowError(null);
          try {
            const f = await getConversationFlow(flowId);
            setFlow(f);
          } catch (fe: any) {
            setFlowError(fe.message);
          } finally {
            setFlowLoading(false);
          }
        } else {
          setFlow(null);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const isNew = !id || id === "new";
      if (isNew) {
        const name = (agent?.agent_name || "").trim() || undefined;
        const voice = (agent?.voice_id || "").trim() || undefined;
        await createAgent({ agent_name: name, voice_id: voice });
      } else {
        const body: Record<string, unknown> = {};
        if (agent) {
          for (const key of editableFields) body[key] = (agent as any)[key];
        }
        if (advancedJson && advancedJson.trim()) {
          try {
            const extra = JSON.parse(advancedJson);
            if (extra && typeof extra === "object") Object.assign(body, extra);
          } catch (parseErr: any) {
            throw new Error(`Advanced JSON is invalid: ${parseErr.message}`);
          }
        }
        // Convert text/JSON helpers
        if (boostedKeywordsText && boostedKeywordsText.trim()) {
          const arr = boostedKeywordsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          body["boosted_keywords"] = arr;
        }
        if (pronunciationDictionaryJson && pronunciationDictionaryJson.trim()) {
          try {
            const parsed = JSON.parse(pronunciationDictionaryJson);
            if (Array.isArray(parsed))
              body["pronunciation_dictionary"] = parsed;
            else throw new Error("pronunciation_dictionary must be an array");
          } catch (err: any) {
            throw new Error(
              `Pronunciation Dictionary JSON invalid: ${err.message}`
            );
          }
        }
        if (piiConfigJson && piiConfigJson.trim()) {
          try {
            const parsed = JSON.parse(piiConfigJson);
            if (parsed && typeof parsed === "object")
              body["pii_config"] = parsed;
            else throw new Error("pii_config must be an object");
          } catch (err: any) {
            throw new Error(`PII Config JSON invalid: ${err.message}`);
          }
        }
        await updateAgent(id, body);
        if (
          flow &&
          (flow.conversation_flow_id ||
            (agent as any)?.response_engine?.conversation_flow_id)
        ) {
          const flowId = (flow.conversation_flow_id ||
            (agent as any)?.response_engine?.conversation_flow_id) as string;
          const payload: Partial<ConversationFlow> = {};
          if (typeof flow.global_prompt === "string")
            payload.global_prompt = flow.global_prompt;
          if (Array.isArray(flow.nodes)) payload.nodes = flow.nodes;
          await updateConversationFlow(flowId, payload);
        }
      }
      router.push("/agents");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: (typeof editableFields)[number], value: unknown) =>
    setAgent((prev) =>
      prev ? ({ ...prev, [key]: value } as RetellAgent) : prev
    );

  const conversationNodes: ConversationFlowNode[] = useMemo(
    () => (flow?.nodes || []).filter((n) => n?.type === "conversation"),
    [flow]
  );

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        {id === "new" ? "Create Retell Agent" : "Edit Retell Agent"}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading && <Typography>Loading…</Typography>}
      {agent && (
        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={onSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Agent Name"
                    fullWidth
                    value={String(agent.agent_name || "")}
                    onChange={(e) => setField("agent_name", e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Display name for this agent.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Voice ID</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"

                      value={agent.voice_id || "11labs-Andrew"}
                      label="Voice ID"
                      onChange={(e) => setField("voice_id", e.target.value)}
                    >
                      <MenuItem value={"11labs-Andrew"}>11labs-Andrew</MenuItem>
                      <MenuItem value={"11labs-Anthony"}>11labs-Anthony</MenuItem>
                      <MenuItem value={"11labs-Amy"}>11labs-Amy</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Voice Speed"
                    type="number"
                    inputProps={{ step: 0.05 }}
                    fullWidth
                    value={Number(agent.voice_speed ?? 1)}
                    onChange={(e) =>
                      setField("voice_speed", Number(e.target.value))
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Speech rate multiplier (1 = normal).">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Voice Temperature"
                    type="number"
                    inputProps={{ step: 0.05 }}
                    fullWidth
                    value={Number(agent.voice_temperature ?? 1)}
                    onChange={(e) =>
                      setField("voice_temperature", Number(e.target.value))
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Controls voice variation/creativity.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Tooltip title="Allow brief verbal acknowledgements like 'uh-huh' while listening.">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(agent.enable_backchannel)}
                          onChange={(e) =>
                            setField("enable_backchannel", e.target.checked)
                          }
                        />
                      }
                      label="Enable Backchannel"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Backchannel Frequency (0-1)"
                    type="number"
                    inputProps={{ step: 0.05, min: 0, max: 1 }}
                    fullWidth
                    value={Number((agent as any)?.backchannel_frequency ?? 0.9)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              backchannel_frequency: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="How often backchannel words are used.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Audio & transcription section */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Audio & Transcription
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Language (e.g. en-US)"
                    fullWidth
                    value={String((agent as any)?.language || "")}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({ ...prev, language: e.target.value } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Primary ASR/TTS locale.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="STT Mode (fast|accurate)"
                    fullWidth
                    value={String((agent as any)?.stt_mode || "")}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({ ...prev, stt_mode: e.target.value } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Speech-to-text accuracy vs speed.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Vocabulary Specialization"
                    fullWidth
                    value={String((agent as any)?.vocab_specialization || "")}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              vocab_specialization: e.target.value,
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Domain-specific vocabulary biasing.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Denoising Mode"
                    fullWidth
                    value={String((agent as any)?.denoising_mode || "")}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({ ...prev, denoising_mode: e.target.value } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Background noise reduction strategy.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Volume (0-1)"
                    type="number"
                    inputProps={{ step: 0.05, min: 0, max: 1 }}
                    fullWidth
                    value={Number((agent as any)?.volume ?? 1)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({ ...prev, volume: Number(e.target.value) } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Overall output loudness.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Ambient Sound (e.g. coffee-shop)"
                    fullWidth
                    value={String((agent as any)?.ambient_sound || "")}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({ ...prev, ambient_sound: e.target.value } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Background ambiance to mix in.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Ambient Sound Volume (0-1)"
                    type="number"
                    inputProps={{ step: 0.05, min: 0, max: 1 }}
                    fullWidth
                    value={Number((agent as any)?.ambient_sound_volume ?? 1)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              ambient_sound_volume: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Level of ambient background sound.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Interruption Sensitivity (0-1)"
                    type="number"
                    inputProps={{ step: 0.05, min: 0, max: 1 }}
                    fullWidth
                    value={Number(
                      (agent as any)?.interruption_sensitivity ?? 1
                    )}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              interruption_sensitivity: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="How easily the agent cuts in while user speaks.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Responsiveness (0-1)"
                    type="number"
                    inputProps={{ step: 0.05, min: 0, max: 1 }}
                    fullWidth
                    value={Number((agent as any)?.responsiveness ?? 1)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              responsiveness: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="How quickly the agent replies.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Reminder Trigger (ms)"
                    type="number"
                    inputProps={{ step: 100 }}
                    fullWidth
                    value={Number((agent as any)?.reminder_trigger_ms ?? 10000)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              reminder_trigger_ms: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Delay of silence before a reminder is played.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Reminder Max Count"
                    type="number"
                    inputProps={{ step: 1, min: 0 }}
                    fullWidth
                    value={Number((agent as any)?.reminder_max_count ?? 2)}
                    onChange={(e) =>
                      setAgent((prev) =>
                        prev
                          ? ({
                              ...prev,
                              reminder_max_count: Number(e.target.value),
                            } as any)
                          : prev
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Maximum number of reminders to play.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Boosted Keywords (comma separated)"
                    fullWidth
                    value={boostedKeywordsText}
                    onChange={(e) => setBoostedKeywordsText(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Words to bias recognition towards.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Pronunciation Dictionary (JSON array)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={pronunciationDictionaryJson}
                    onChange={(e) =>
                      setPronunciationDictionaryJson(e.target.value)
                    }
                    placeholder='[{"word":"actually","alphabet":"ipa","phoneme":"ˈæktʃuəli"}]'
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Custom pronunciations for specific words.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="PII Config (JSON object)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={piiConfigJson}
                    onChange={(e) => setPiiConfigJson(e.target.value)}
                    placeholder='{"mode":"post_call","categories":["credit_card","ssn"]}'
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Sensitive data redaction settings.">
                            <InfoOutlined fontSize="small" />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Advanced Agent Options (JSON patch)
                  </Typography>
                  <TextField
                    label="Advanced JSON"
                    fullWidth
                    multiline
                    minRows={4}
                    value={advancedJson}
                    onChange={(e) => setAdvancedJson(e.target.value)}
                    placeholder='{"webhook_url":"https://...","interrupt_sensitivity":0.6}'
                  />
                </Grid>

                {id !== "new" && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Conversation Flow
                    </Typography>
                    {flowError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {flowError}
                      </Alert>
                    )}
                    {flowLoading && <Typography>Loading flow…</Typography>}
                    {flow && (
                      <Box>
                        <TextField
                          label="Global Prompt"
                          fullWidth
                          multiline
                          minRows={3}
                          sx={{ mb: 2 }}
                          value={String(flow.global_prompt || "")}
                          onChange={(e) =>
                            setFlow((prev) =>
                              prev
                                ? { ...prev, global_prompt: e.target.value }
                                : prev
                            )
                          }
                        />

                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Conversation Nodes
                        </Typography>
                        <Stack spacing={2}>
                          {conversationNodes.map((n, idx) => (
                            <Card key={n.id || idx} variant="outlined">
                              <CardContent sx={{ backgroundColor: "#f0f0f0" }}>
                                <Stack spacing={1}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Node ID: {n.id}
                                  </Typography>
                                  <TextField
                                    label="Name"
                                    fullWidth
                                    value={String(n.name || "")}
                                    onChange={(e) =>
                                      setFlow((prev) => {
                                        if (!prev) return prev;
                                        const nodes = [...(prev.nodes || [])];
                                        const nodeIndex = nodes.findIndex(
                                          (x) => x.id === n.id
                                        );
                                        if (nodeIndex >= 0)
                                          nodes[nodeIndex] = {
                                            ...nodes[nodeIndex],
                                            name: e.target.value,
                                          };
                                        return { ...prev, nodes };
                                      })
                                    }
                                  />
                                  <TextField
                                    label="Instruction Text"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={String(n?.instruction?.text || "")}
                                    onChange={(e) =>
                                      setFlow((prev) => {
                                        if (!prev) return prev;
                                        const nodes = [...(prev.nodes || [])];
                                        const nodeIndex = nodes.findIndex(
                                          (x) => x.id === n.id
                                        );
                                        if (nodeIndex >= 0) {
                                          const existing = nodes[nodeIndex];
                                          const instruction = {
                                            type: "prompt" as const,
                                            text: e.target.value,
                                          };
                                          nodes[nodeIndex] = {
                                            ...existing,
                                            instruction,
                                          };
                                        }
                                        return { ...prev, nodes };
                                      })
                                    }
                                  />
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                          {conversationNodes.length === 0 && (
                            <Typography color="text.secondary">
                              No conversation nodes available to edit.
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Grid>
                )}
              </Grid>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" disabled={loading}>
                  {id === "new" ? "Create" : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push("/agents")}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
