import {createTheme} from "@mui/material";
import {makeStyles} from "@mui/styles";


export const theme = createTheme({
    palette: {
        primary: {
            main:"#FFFFFF",
        },
        secondary: {
            main:"#A0A0A0",
        },
    },
    typography: {
        fontFamily: [
            'Helvetica Neue'
        ],
    },
});

export const style = makeStyles({
    diagram: {
        marginTop: "10em"
    }
})