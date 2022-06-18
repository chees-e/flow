import React from "react";
import {Button} from "@mui/material";
import {withStyles} from "@mui/styles";

const StyledDirectoryUploadButton = withStyles({
    root: {
        alignItems: "center",
        justifyContent: "center",
        height: "40px",
        width: "auto",
        padding: "0 35px",
        boxSizing: "border-box",
        borderRadius: 0,
    },
})(Button);


export function DirectoryUploadButton(props) {
    const {handleChange} = props;
    return (
        <div>
                <StyledDirectoryUploadButton
                    id="directory-input"
                    variant="contained"
                    component="label"
                >
                    Upload directory
                    <input
                        id="directory-file-input"
                        directory=""
                        webkitdirectory=""
                        type="file"
                        style={{display: 'none'}}
                        onChange={handleChange}
                    />
                </StyledDirectoryUploadButton>
        </div>
    );
}