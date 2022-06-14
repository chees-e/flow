import React from "react";
import mermaid from "mermaid"

class Mermaid extends React.Component {
    componentDidMount() {
        mermaid.contentLoaded();
    }
    render() {
        return <div className="mermaid" style={{ width: 500, height: 300 }}>{this.props.chart}</div>;
    }
}

let text = "sequenceDiagram\n" +
    "    Alice->>+John: Hello John, how are you?\n" +
    "    Alice->>+John: John, can you hear me?\n" +
    "    John-->>-Alice: Hi Alice, I can hear you!\n" +
    "    John-->>-Alice: I feel great!"


export function Diagram() {
    return (
        <Mermaid chart={text}/>
    )
}