import {parse} from 'espree'
// const espree = require('espree');
const estraverse = require('estraverse');
// const glob = require("glob");
// const esprima = require('esprima');

// UPDATE:
/* fxnDec and fileExports values and fileImports values will all store in the format: filename.js:fxnname
fxnExports and fileImports keys are still just the alias name
*/
let fxnDec = {};
let fxnExports = {};
let fileImports = {};

function getAllDec(file_name, file_data) {
    let fileExports = {};
    let functionArg = parse(file_data, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    functionArg.body.forEach ( dec => {
        if (dec.type === "FunctionDeclaration"){

            let decName = file_name + ":" + dec.id.name;
            fxnDec[decName] = file_name; // don't really need the path? but placeholder in case if we need something
        } else if (dec.type === "VariableDeclaration") {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type === "ArrowFunctionExpression") {
                    if (dec.declarations[i].id) {
                        let decName = file_name + ":" + dec.declarations[i].id.name;
                        fxnDec[decName] = file_name;
                    }
                }
            }
        } else if (dec.type === "ExpressionStatement" && dec.expression.type === "AssignmentExpression") {
            if (dec.expression.left.property && dec.expression.left.property.name === "exports") {
                if (dec.expression.right.type === "ObjectExpression") {
                    fileExports = {}; // Everything before is now overridden;
                    for (let i = 0; i < dec.expression.right.properties.length; i++) {
                        let decName = file_name + ":" + dec.expression.right.properties[i].value.name;

                        if (decName in fxnDec) { // function must be declared before
                            fileExports[dec.expression.right.properties[i].key.name] = decName;
                        }
                    }
                }
            } else if (dec.expression.left.object && dec.expression.left.object.object && dec.expression.left.object.object.name === "module") {
                if (dec.expression.left.object.property.name === "exports" && dec.expression.right.type === "Identifier") {
                    let decName = file_name + ":" + dec.expression.right.name;
                    if (decName in fxnDec) { // function must be declared before
                        fileExports[dec.expression.left.property.name] = decName;
                    }
                }
            }
        }
    });

    return fileExports;
};


// Create a nested object from desired folder
function getFileStruc(file_names, file_data) {
    let flattened_result = [];

    // Get all declared functions
    for (let i = 0; i < file_names.length; i++) {
        console.log("Finding functions in "+ file_names[i]);
        let fileExports = getAllDec(file_names[i], file_data[i]);
        fxnExports[file_names[i]] = fileExports;
    }

    // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript

    for (let i = 0; i < file_names.length; i++) {
        console.log("entering " + file_names[i]);
        let fileFunctions = assignFileFunction(file_names[i], file_data[i]);
        flattened_result.push({name: file_names[i], children: fileFunctions[0], calls: fileFunctions[1], exports: fxnExports[file_names[i]]});
    }

    return flattened_result;
}

function findForLoop(dec, file_name) {
    let callList = [];
    let nestedCounter = 0;
    let callsChildrenList = [];
    try {
        estraverse.traverse(dec, {
            enter: function (node, parent) {
                if (node.type === 'BlockStatement' && parent.type === 'ForStatement') {
                    let typeChildrenList = [];

                    node.body.forEach( children => {
                        if (children.type === 'ExpressionStatement') {
                            let expression = children.expression;
                            if (expression.type === 'CallExpression'){
                                // TODO fix fxn dec later, also add imports support?
                                if (expression.callee.type === "MemberExpression") {
                                    if (file_name + ":" + expression.callee.property.name in fxnDec){
                                        if (expression.callee.object.hasOwnProperty('name')){
                                            console.log("Adding " + expression.callee.object.name + '.' +expression.callee.property.name);
                                            callsChildrenList.push(expression.callee.object.name + '.' +expression.callee.property.name);
                                        } else {
                                            console.log("Adding: " + expression.callee.property.name);
                                            callsChildrenList.push(expression.callee.property.name);
                                        }
                                    }
                                } else if (file_name + ":" + expression.callee.name in fxnDec) {
                                    console.log("Adding " + expression.callee.name);
                                    callsChildrenList.push(expression.callee.name);
                                }
                            }
                        }
                        typeChildrenList.push(children.type)
                    })
                    if (typeChildrenList.includes('ForStatement')){
                        nestedCounter+=1;
                    } else {
                        console.log('inner loop:' + nestedCounter + '; calls:' + callsChildrenList)
                        callList.push({innerLoops: nestedCounter, callsInLoop: callsChildrenList})
                        callsChildrenList = [];
                        nestedCounter=0;
                    }
                    typeChildrenList = [];
                }
            }
        });
    } catch (e) {
        console.log("something went wrong: " + e);
        return [];
    }
    return callList;
}

// TODO: Note: added path
function traverseNode(dec, file_name) {
    let callList = [];
    try {
        estraverse.traverse(dec, {
            enter: function (node, parent) {
                if (node.type === 'CallExpression') {
                    if (node.callee.name === "require") {
                        // when you require you don't need to add the .js so ill add it in case if it doesn't
                        // this may go wrong?

                        //TODO, might need to link the variable declared for this require to the imports 
                        //since we are using it later.
                        let filename = node.arguments[0].value.replaceAll("\\", "/").split('/').reverse()[0];
                        if (!filename.endsWith(".js")) {
                            filename = filename + ".js";
                        }
                        if (filename in fxnExports) {
                            fileImports = {...fxnExports[filename], ...fileImports};
                        }
                    } else if (node.callee.type === "MemberExpression"){
                        let callName = file_name + ":" + node.callee.property.name;

                        if (callName in fxnDec) {
                            callList.push(callName);
                        // Making sure there are imports
                        } else if (Object.keys(fileImports).length && node.callee.property.name in fileImports) {
                            callName = fileImports[node.callee.property.name];
                            callList.push(callName);           
                        }
                    } else {
                        let callName = file_name + ":" + node.callee.name;
                        if (callName in fxnDec) {
                            callList.push(callName);
                        } else if (Object.keys(fileImports).length && node.callee.name in fileImports) {
                            callName = fileImports[node.callee.name];
                            callList.push(callName);
                        }
                    } 
                }
            }
        });
    } catch (e) {
        console.log("something went wrong: " + e);
        return [];
    }

    return callList;
}

// find .js files in nested object
function assignFileFunction(file_name, file_data) {
    let fxnList = [];
    let fxnCalls = [];
    let fxnLoops = [];
    let functionArg = parse(file_data, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    fileImports = {}; // reset imports
    functionArg.body.forEach ( dec => {
        if (dec.type === "FunctionDeclaration"){
            let callList = [];
            let loopList = [];

            callList = traverseNode(dec, file_name);
            loopList = findForLoop(dec, file_name);
            const fxnObject = {fxnId: dec.id.name, calls: callList, loops: loopList};
            fxnList.push(fxnObject);
        } else if (dec.type === "VariableDeclaration" ) {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type === "ArrowFunctionExpression") {
                    let callList = traverseNode(dec.declarations[i], file_name);
                    let loopList = findForLoop(dec.declarations[i], file_name);

                    const fxnObject = {fxnId: dec.declarations[i].id.name, calls: callList, loops: loopList};
                    fxnList.push(fxnObject);
                } else {
                    // for adding imports
                    let callList = traverseNode(dec, file_name);
                    // function calls could be part of Variable declaration
                    fxnCalls = fxnCalls.concat(callList);
                }
            }
        } else {
            let callList = traverseNode(dec, file_name);
            let loopList = findForLoop(dec, file_name);
            fxnCalls = fxnCalls.concat(callList);
            fxnLoops = fxnLoops.concat(loopList)
        }
    })
    return [fxnList, fxnCalls, fxnLoops];
}

// Uses flattened result
function parseToMermaid(result) {
    let out = "flowchart LR;";

    // Creating subgraphs and calls within each file
    for (let i = 0; i < result.length; i++) {
        let filename = result[i]["name"];

        out += "subgraph " + filename + ";";

        for (let j = 0; j < result[i]["children"].length; j++) {
            let fxnId = filename + ":" + result[i]["children"][j]["fxnId"];
            out += fxnId + ";";
            for (let k = 0; k < result[i]["children"][j]["calls"].length; k++) {
                let callname = result[i]["children"][j]["calls"][k];
                if (callname.split(":")[0] === filename) { // belongs under the same graph
                    out += fxnId + " --> " + callname + ";"; 
                }
            }
        }
        out += "end;"
    }

    // Creating connections between subgraphs
    for (let i = 0; i < result.length; i++) {
        let filename = result[i]["name"];

        for (let j = 0; j < result[i]["children"].length; j++) {
            let fxnId = filename + ":" + result[i]["children"][j]["fxnId"];
            for (let k = 0; k < result[i]["children"][j]["calls"].length; k++) {
                let callname = result[i]["children"][j]["calls"][k];
                if (callname.split(":")[0] !== filename) { // belongs under the same graph
                    out += fxnId + " --> " + callname + ";"; 
                }
            }
        }

        for (let j = 0; j < result[i]["calls"].length; j++) {
            let callname = result[i]["calls"][j];
            if (callname.split(":")[0] !== filename) { 
                out += filename + " --> " + callname + ";"; 
            }
        }
    }

    return out;
} 

function getMermaidString (file_names, file_data) {
    return new Promise((resolve, reject) => {
        const json_out = getFileStruc(file_names, file_data);
        const out = parseToMermaid(json_out);
        resolve(out);
    });
}

// console.log("\n\n\n\n\nStarting...")

// example usage
// let res;

// res = getFileStruc("..\\..\\test\\");
// console.log("Declarations: " + JSON.stringify(fxnDec));
// console.log("Exports: " + JSON.stringify(fxnExports));
// console.log("Results: " + JSON.stringify(res));
// console.log("Mermaid: " + parseToMermaid(res));

// espree.VisitorKeys

// let fd = [`import './App.css';\r\nimport {Stack, ThemeProvider, Typography} from \"@mui/material\";\r\nimport {theme, style} from \"./style/Theme\";\r\nimport {DiagramPage} from \"./components/DiagramPage\";\r\nimport mermaid from \"mermaid\";\r\n\r\n\r\n\r\nfunction App() {\r\n    const classes = style();\r\n  return (\r\n    <div className=\"App\">\r\n        <ThemeProvider theme={theme}>\r\n            <header className=\"App-header\">\r\n                <Typography variant={\"h2\"}>\r\n                    flow\r\n                </Typography>\r\n            </header>\r\n            <Stack className={classes.diagram} direction={\"column\"} justifyContent={\"center\"} alignItems={\"center\"}>\r\n                <DiagramPage/>\r\n            </Stack>\r\n        </ThemeProvider>\r\n    </div>\r\n  );\r\n}\r\n\r\nexport default App;\r\n`
// ,`import { render, screen } from '@testing-library/react';\r\nimport App from './App';\r\n\r\ntest('renders learn react link', () => {\r\n  render(<App />);\r\n  const linkElement = screen.getByText(/learn react/i);\r\n  expect(linkElement).toBeInTheDocument();\r\n});\r\n`
// ,`import React from 'react';\r\nimport ReactDOM from 'react-dom/client';\r\nimport './index.css';\r\nimport App from './App';\r\nimport reportWebVitals from './reportWebVitals';\r\n\r\nconst root = ReactDOM.createRoot(document.getElementById('root'));\r\nroot.render(\r\n  <React.StrictMode>\r\n    <App />\r\n  </React.StrictMode>\r\n);\r\n\r\n// If you want to start measuring performance in your app, pass a function\r\n// to log results (for example: reportWebVitals(console.log))\r\n// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals\r\nreportWebVitals();\r\n`
// ,`const reportWebVitals = onPerfEntry => {\r\n  if (onPerfEntry && onPerfEntry instanceof Function) {\r\n    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {\r\n      getCLS(onPerfEntry);\r\n      getFID(onPerfEntry);\r\n      getFCP(onPerfEntry);\r\n      getLCP(onPerfEntry);\r\n      getTTFB(onPerfEntry);\r\n    });\r\n  }\r\n};\r\n\r\nexport default reportWebVitals;\r\n`
// ,`// jest-dom adds custom jest matchers for asserting on DOM nodes.\r\n// allows you to do things like:\r\n// expect(element).toHaveTextContent(/react/i)\r\n// learn more: https://github.com/testing-library/jest-dom\r\nimport '@testing-library/jest-dom';\r\n`
// ];

// let fn = [
//     "App.js", "App.test.js"
// , "index.js"
// , "reportWebVitals.js"
// , "setupTests.js"
// ]

// let res = getFileStruc(fn, fd, espree, estraverse);
// console.log(JSON.stringify(res));

export {getMermaidString};



















