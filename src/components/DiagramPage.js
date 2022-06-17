import React, {useState} from "react";
import {Divider, Stack} from "@mui/material";
import {style} from "../style/Theme";
import {MermaidDiagram} from "./MermaidDiagram";
import {UploadButton} from "./UploadButton";
import {DirectoryInput} from "./DirectoryInput";

const placeHolderGraphData = "flowchart TD;id1(Enter a path to get started)";
const placeHolderProcessedGraphData = "flowchart TD;A[Start] --> B{getName};B -->|sum| C[D];C --> D[calc];D --> B;B ---->|F| E[End]";
let graphData = placeHolderGraphData;

export const DiagramPage = () => {
    const [hasUploaded ,setHasUploaded] = useState(false);
    const [isSuccess, setIsSuccess] = useState(true);
    const classes = style();

    function onUpload() {
        const input = document.getElementById("directory-input").value;
        console.log(input);
        setHasUploaded(!hasUploaded);
        // todo: add backend logic to process the input
        graphData = placeHolderProcessedGraphData;
        const graph = document.getElementById("top-diagram");
    }

    return (
        <Stack className={classes.diagram}
               direction={"column"}
               spacing={10}
               justifyContent={"center"}
               alignItems={"center"}
               divider={<Divider orientation="horizontal" className={classes.divider} flexItem/>}
        >
            <Stack direction={"row"} spacing={4} justifyContent={"center"} alignItems={"center"}>
                <Stack item>
                    <DirectoryInput/>
                </Stack>
                <Stack item>
                    <UploadButton handleClick={onUpload}/>
                </Stack>
            </Stack>
            <Stack item>
                <div id={"top-diagram"}>
                    <MermaidDiagram chart={graphData}/>
                </div>
            </Stack>
            <Stack item>
                <div id={"bottom-diagram"}>
                    <MermaidDiagram chart={graphData}/>
                </div>
            </Stack>
        </Stack>
    )
}