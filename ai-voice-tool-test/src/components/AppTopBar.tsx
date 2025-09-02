"use client"
import Link from "next/link"
import { AppBar, Toolbar, Typography, Button, Stack, Box } from "@mui/material"

export default function AppTopBar() {
  return (
    <AppBar position="fixed" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" component={Link} href="/" style={{ textDecoration: "none", color: "inherit" }}>
          E3 Voice
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/" color="inherit">Home</Button>
          <Button component={Link} href="/calls" color="inherit">Calls</Button>
          <Button component={Link} href="/agents" color="inherit">Agents</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}


