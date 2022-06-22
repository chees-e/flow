import './App.css';
import {Stack, ThemeProvider, Typography} from "@mui/material";
import {theme, style} from "./style/Theme";
import {DiagramPage} from "./components/DiagramPage";
import mermaid from "mermaid";



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
                <DiagramPage/>
            </Stack>
        </ThemeProvider>
    </div>
  );
}

export default App;
