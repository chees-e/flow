import React from "react";
import {Button} from "@mui/material";
import {withStyles} from "@mui/styles";

const StyledUploadButton = withStyles({
    root: {
        alignItems: "center",
        justifyContent: "center",
        height: "40px",
        width: "100px",
        padding: "0 35px",
        boxSizing: "border-box",
        borderRadius: 0,
    },
})(Button);

export function UploadButton(props) {
    const {handleClick} = props;
    return (
        <StyledUploadButton variant="contained" onClick={handleClick}>Upload</StyledUploadButton>
    );
}