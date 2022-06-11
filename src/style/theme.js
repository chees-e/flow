import {createTheme} from "@mui/material";


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
        h4: {
            fontWeight: 600,
            fontSize: 28,
            lineHeight: '2rem',
        },
        h5: {
            fontWeight: 100,
            lineHeight: '2rem',
        },
    },
});