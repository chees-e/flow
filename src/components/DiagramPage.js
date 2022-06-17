import React from "react";
import {Divider, Stack} from "@mui/material";
import {style} from "../style/Theme";
import {MermaidDiagram} from "./MermaidDiagram";
import {UploadButton} from "./UploadButton";
import {DirectoryInput} from "./DirectoryInput";
import mermaid from "mermaid";

const placeHolderGraphData = "flowchart TD;id1(Enter a path to get started)";
const placeHolderProcessedGraphData = "flowchart TD;A[Start] --> B{getName};B -->|sum| C[D];C --> D[calc];D --> B;B ---->|F| E[End]";
let diagramData = placeHolderGraphData;

export const DiagramPage = () => {
    const classes = style();

    function onUpload() {
        const input = document.getElementById("directory-input").value;
        console.log(input);
        // todo: add backend logic to process the input
        diagramData = placeHolderProcessedGraphData;

        // replace the graphs
        const topDiagram = document.getElementById("diagram");
        let replaceDiagram = function (data) {
            topDiagram.innerHTML = data;
        };

        mermaid.render("preparedScheme", diagramData, replaceDiagram);
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
                <div id={"diagram"}>
                    <MermaidDiagram chart={diagramData}/>
                </div>
            </Stack>
        </Stack>
    )
}