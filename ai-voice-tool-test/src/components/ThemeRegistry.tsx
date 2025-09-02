"use client"
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ReactNode } from 'react'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  shape: { borderRadius: 10 },
})

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}


