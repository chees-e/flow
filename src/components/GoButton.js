import React from "react";
import {Button} from "@mui/material";
import {withStyles} from "@mui/styles";

const StyledGoButton = withStyles({
    root: {
        alignItems: "center",
        justifyContent: "center",
        height: "40px",
        width: "auto",
        background: "black",
        padding: "0 35px",
        boxSizing: "border-box",
        borderRadius: 0
    },
})(Button);

export function GoButton(props) {
    const {handleClick, disabled} = props;
    return (
        <StyledGoButton id="go-button"
                        variant="contained"
                        style={{background: "#EEA9A9", color: "#ffffff"}}
                        onClick={handleClick}
                        disabled={disabled}
        >
            Go
        </StyledGoButton>
    );
}