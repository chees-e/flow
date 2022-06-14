import './App.css';
import {Stack, ThemeProvider, Typography} from "@mui/material";
import {theme, style} from "./style/Theme";
import {Diagram} from "./components/Diagram";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
        'primaryColor': '#EEA9A9',
        'primaryTextColor': '#ffffff',
        'secondaryColor': '#FEDFE1',
        'fontFamily': 'arial'
    }
});

function App() {
    const classes = style();
  return (
    <div className="App">
        <ThemeProvider theme={theme}>
            <header className="App-header">
                <Typography variant={"h2"}>
                    flow
                </Typography>
            </header>
            <Stack className={classes.diagram} direction={"column"} justifyContent={"center"} alignItems={"center"}>
                <Diagram/>
            </Stack>
        </ThemeProvider>
    </div>
  );
}

export default App;
