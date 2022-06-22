import React, {useState} from "react";
import {Divider, Stack, Typography} from "@mui/material";
import {style} from "../style/Theme";
import {MermaidDiagram} from "./MermaidDiagram";
import {GoButton} from "./GoButton";
import {DirectoryUploadButton} from "./DirectoryUploadButton";
import mermaid from "mermaid";

// fs doesn't work with react
import {getMermaidString} from "../controller/FileStructureObject.js";

const placeHolderGraphData = "flowchart TD;id1(UPLOAD YOUR PROJECT DIRECTORY TO GET STARTED)";
const placeHolderProcessedGraphData = "flowchart LR;subgraph esp.js;end;subgraph test.js;test.js:examplefxn;test.js:examplefxn2;end;subgraph test2.js;test2.js:func;test2.js:func4;end;test.js --> test2.js:func;test.js --> test.js:examplefxn;";
let diagramData = placeHolderGraphData;

export const DiagramPage = () => {
    const classes = style();
    const [directoryUploaded, setDirectoryUploaded] = useState(false);

    function displayDiagram(data) {
        diagramData = data;

        // replace the graphs
        const topDiagram = document.getElementById("diagram");
        let replaceDiagram = function (data) {
            topDiagram.innerHTML = data;
        };

        mermaid.render("preparedScheme", diagramData, replaceDiagram);
    }

    function onUpload() {
        setDirectoryUploaded(true);
        const fileCount = document.getElementById("directory-file-input").files.length;
        document.getElementById("file-count-label").innerHTML = fileCount + " files uploaded";
    }

    function onGo() {
        setDirectoryUploaded(false);
        const input = document.getElementById("directory-file-input").files;
        console.log(input);
        // todo: add backend logic to process the input
        // const json_out = getFileStruc(input);
        // const mermaid_data = parseToMermaid(json_out);
        // console.log(JSON.stringify(json_out));

        let file_data = [];
        let file_names = [];
        let reader = new FileReader();
        let index = 0;
        reader.addEventListener("load", () => {
            file_data.push(reader.result);
        }, false);

        reader.addEventListener("loadend", () => {
            index = index + 1;
            while (index < input.length && input[index].type !== "text/javascript") {
                index = index + 1; // only reading js files
            }
            if (index < input.length) {
                file_names.push(input[index].name);
                reader.readAsText(input[index]);
            } else {
                console.log(file_data);
                console.log(file_names);
                // let functionArg = parse("console.log('hello word')", {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
                // console.log(functionArg)
                getMermaidString(file_names, file_data).then(out => {
                    console.log(out);
                    displayDiagram(out);
                })
            }
        })

        if (input.length > 0) {
            while (index < input.length && input[index].type !== "text/javascript") {
                index = index + 1; // only reading js files
            }
            if (index < input.length) {
                file_names.push(input[index].name);
                reader.readAsText(input[index]);
            }
        }
    }

    return (
        <Stack className={classes.diagram}
               direction={"column"}
               spacing={4}
               justifyContent={"center"}
               alignItems={"center"}
               divider={<Divider orientation="horizontal" className={classes.divider} flexItem/>}
        >
            <Stack direction={"column"} space={12} justifyContent={"center"} alignItems={"center"}>
                <Stack item>
                    <Stack direction={"row"} spacing={4} justifyContent={"center"} alignItems={"center"}>
                        <Stack item>
                            <DirectoryUploadButton handleChange={onUpload}/>
                        </Stack>
                        <Stack item>
                            <GoButton handleClick={onGo} disabled={!directoryUploaded}/>
                        </Stack>
                    </Stack>
                </Stack>
                <Stack item>
                    <Typography id={"file-count-label"} variant={"caption"} align={"left"} style={{marginTop: "20px", color: "#ffffff"}}>

                    </Typography>
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