import React from "react";
import {TextField} from "@mui/material";
import {style} from "../style/Theme";
import {withStyles} from "@mui/styles";

const StyledDirectoryTextField = withStyles({
    root: {
        '& label.Mui-focused': {
            color: 'white',
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: '#EEA9A9',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'white',
            },
            '&:hover fieldset': {
                borderColor: 'white',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#EEA9A9',
            },
            height: "40px",
        },
    },
})(TextField);


export function DirectoryInput() {
    const classes = style();
    return (
        // <StyledDirectoryTextField className={classes.directoryInput}
        //            id="directory-input"
        //            hiddenLabel
        //            variant="outlined"
        //            placeholder="Enter a path to get started"
        //            InputProps={{
        //                style: {
        //                    color: "white"
        //                }
        //            }}/>
        <input id="directory-input"  directory="" webkitdirectory="" type="file" />
    );
}