import './App.css';
import {CustomButton} from "./components/CustomButton";
import {ThemeProvider} from "@mui/material";
import {theme} from "./style/theme";

function App() {
  return (
    <div className="App">
        <ThemeProvider theme={theme}>
            <header className="App-header">
                <CustomButton/>
            </header>
        </ThemeProvider>
    </div>
  );
}

export default App;
