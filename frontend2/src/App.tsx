import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Room from './components/Room';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Room />
    </ThemeProvider>
  );
}

export default App;
