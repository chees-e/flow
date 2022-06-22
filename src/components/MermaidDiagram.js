import React from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
        'primaryColor': '#EEA9A9',
        'primaryTextColor': '#ffffff',
        'secondaryColor': '#FEDFE1',
        'fontFamily': 'arial',
        'lineColor': '#E87A90',
    }
});

export class MermaidDiagram extends React.Component {
    componentDidMount() {
        mermaid.contentLoaded();
    }

    render() {

        return <div className="mermaid"
                    style={{
                        width:"auto",
                        height: "auto",
                        maxHeight: "100%"
                    }}>{this.props.chart}</div>;
    }
}