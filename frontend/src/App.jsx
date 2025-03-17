import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // Optional: Normalizes CSS
import AppRoutes from './routes';
import { AuthProvider } from './components/AuthContext';
import './App.css';

const theme = createTheme({
  // Optional: Customize your theme here
  palette: {
    primary: {
      main: '#1976d2', // Default MUI primary color
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif', // Default MUI font
  },
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Optional: Ensures consistent styling */}
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;