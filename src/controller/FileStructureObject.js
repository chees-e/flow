const fs = require('fs');
const path = require("path");
const glob = require("glob");
const esprima = require('esprima');
const espree = require('espree');
const estraverse = require('estraverse');

// https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
let files = [];
const getFilesRecursively = (directory) => {
    if (directory.includes("node_modules")) {
        return;
    }

    if (!fs.lstatSync(directory).isDirectory()) {
        files.push(directory);
        return;
    }

    const filesInDirectory = fs.readdirSync(directory);
    for (const file of filesInDirectory) {
        const absolute = path.join(directory, file);
        if (fs.statSync(absolute).isDirectory()) {
            getFilesRecursively(absolute);
        } else {
            files.push(absolute);
        }
    }
};

// TODO: resolving multiple files with the same function names
// UPDATE:
/* fxnDec and fileExports values and fileImports values will all store in the format: filename.js:fxnname
fxnExports and fileImports keys are still just the alias name
*/
let fxnDec = {};
let fxnExports = {};
let fileImports = {};

function getFileName(path) {
    return path.replaceAll("\\", "/").replace(/^(\/)/, "").split('/').reverse()[0];
}

function getAllDec(path) {
    let fileExports = {};
    let file = fs.readFileSync(path, "utf8");
    let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    functionArg.body.forEach ( dec => {
        if (dec.type === "FunctionDeclaration"){
            // if (dec.id && dec.id.name in fxnDec) {
            //     fxnDec[dec.id.name]["sources"].push(file);
            // } else {
            //     fxnDec[dec.id.name] = {"sources": [path]};
            // }

            let decName = getFileName(path) + ":" + dec.id.name;
            fxnDec[decName] = path; // don't really need the path? but placeholder in case if we need something
        } else if (dec.type == "VariableDeclaration") {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type == "ArrowFunctionExpression") {
                    // if (dec.declarations[i].id && dec.declarations[i].id.name in fxnDec) {
                    //     fxnDec[dec.declarations[i].id.name]["sources"].push(file);
                    // } else if (dec.declarations[i].id) {
                    //     fxnDec[dec.declarations[i].id.name] = {"sources": [path]};
                    // }
                    if (dec.declarations[i].id) {
                        let decName = getFileName(path) + ":" + dec.declarations[i].id.name;
                        fxnDec[decName] = path;
                    }
                }
            }
        } else if (dec.type == "ExpressionStatement" && dec.expression.type == "AssignmentExpression") {
            if (dec.expression.left.property && dec.expression.left.property.name == "exports") {
                console.log("EXPORT 1")
                if (dec.expression.right.type == "ObjectExpression") {
                    fileExports = {}; // Everything before is now overridden;
                    for (let i = 0; i < dec.expression.right.properties.length; i++) {
                        let decName = getFileName(path) + ":" + dec.expression.right.properties[i].value.name;

                        if (decName in fxnDec) { // function must be declared before
                            fileExports[dec.expression.right.properties[i].key.name] = decName;
                        }
                    }
                }
            } else if (dec.expression.left.object && dec.expression.left.object.object && dec.expression.left.object.object.name == "module") {
                console.log("EXPORT 2")

                if (dec.expression.left.object.property.name == "exports" && dec.expression.right.type == "Identifier") {
                    let decName = getFileName(path) + ":" + dec.expression.right.name;
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
function getFileStruc(dir) {
    let result = [];
    let level = {result};
    let flattened_result = [];
    
    getFilesRecursively(dir);

    // Get all declared functions
    files.forEach(path => {
        let filename = getFileName(path);
        if (path.endsWith(".js") && !filename.startsWith(".")){
            console.log("Finding functions in "+ path);
            fileExports = getAllDec(path);
            fxnExports[filename] = fileExports;
        }
    })

    // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript
    files.forEach(path => {
        path.replace(dir, "root/").replaceAll("\\", "/").replaceAll("//", "/").replace(/^(\/)/, "").split('/').reduce((r, name) => {
            if (!r[name]) {
                r[name] = {result: []};
                if (name.endsWith(".js") && !getFileName(path).startsWith(".")){
                    console.log("entering " + name);
                    let fileFunctions = assignFileFunction(path);
                    flattened_result.push({name, children: fileFunctions[0], calls: fileFunctions[1], exports: fxnExports[name]});
                    r.result.push({name, children: fileFunctions[0], calls: fileFunctions[1], exports: fxnExports[name]});
                } else{
                    // remove the if statement if need to include all files
                    if (!name.includes(".")) {
                        r.result.push({name, children: r[name].result});
                    }
                }
            }
            return r[name];
        }, level)
    })
    // console.log(flattened_result)
    // output = result
    return (flattened_result);
}

function findForLoop(dec, path) {
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
                                    if (getFileName(path) + ":" + expression.callee.property.name in fxnDec){
                                        if (expression.callee.object.hasOwnProperty('name')){
                                            console.log("Adding " + expression.callee.object.name + '.' +expression.callee.property.name);
                                            callsChildrenList.push(expression.callee.object.name + '.' +expression.callee.property.name);
                                        } else {
                                            console.log("Adding: " + expression.callee.property.name);
                                            callsChildrenList.push(expression.callee.property.name);
                                        }
                                    }
                                } else if (getFileName(path) + ":" + expression.callee.name in fxnDec) {
                                    console.log("Adding " + expression.callee.name);
                                    callsChildrenList.push(expression.callee.name);
                                }
                            }
                        }
                        typeChildrenList.push(children.type)
                    })
                    if (typeChildrenList.includes('ForStatement')){
                        nestedCounter+=1;
                        console.log(typeChildrenList)
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
    } catch {
        console.log("something went wrong at " + JSON.stringify(dec));
        return [];
    }
    return callList;
}

// TODO: Note: added path
function traverseNode(dec, path) {
    let callList = [];
    try {
        estraverse.traverse(dec, {
            enter: function (node, parent) {
                if (node.type == 'CallExpression') {
                    if (node.callee.name == "require") {
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
                        let callName = getFileName(path) + ":" + node.callee.property.name;

                        if (callName in fxnDec) {
                            // if (node.callee.object.hasOwnProperty('name')){
                            //     console.log("Adding " + node.callee.object.name + '.' +node.callee.property.name);
                            //     callList.push(node.callee.object.name + '.' +node.callee.property.name);
                            // } else {
                            //     console.log("Adding: " + node.callee.property.name);
                            //     callList.push(node.callee.property.name);
                            // }
                            console.log("Adding1: " + callName);
                            callList.push(callName);
                        // Making sure there are imports
                        } else if (Object.keys(fileImports).length && node.callee.property.name in fileImports) {
                            callName = fileImports[node.callee.property.name];
                            console.log("Adding2: " + callName);
                            callList.push(callName);           
                        }
                    } else {
                        let callName = getFileName(path) + ":" + node.callee.name;
                        if (callName in fxnDec) {
                            console.log("Adding3: " + callName);
                            callList.push(callName);
                        } else if (Object.keys(fileImports).length && node.callee.name in fileImports) {
                            callName = fileImports[node.callee.name];
                            console.log("Adding4: " + callName);
                            callList.push(callName);
                        }
                    } 
                }
            }
        });
    } catch {
        console.log("something went wrong at " + JSON.stringify(dec));
        return [];
    }

    return callList;
}

// find .js files in nested object
function assignFileFunction(path) {
    let fxnList = [];
    let fxnCalls = [];
    let fxnLoops = [];
    let file = fs.readFileSync(path, "utf8");
    let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    console.log("IMPORTS " + JSON.stringify(fileImports))
    fileImports = {}; // reset imports
    functionArg.body.forEach ( dec => {
        console.log("AST: " + dec.type)
        if (dec.type === "FunctionDeclaration"){
            // TODO: add error handling
            let callList = [];
            let loopList = [];

            callList = traverseNode(dec, path);
            loopList = findForLoop(dec, path);
            const fxnObject = {fxnId: dec.id.name, calls: callList, loops: loopList};
            fxnList.push(fxnObject);
        } else if (dec.type == "VariableDeclaration" ) {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type == "ArrowFunctionExpression") {
                    let callList = traverseNode(dec.declarations[i], path);
                    let loopList = findForLoop(dec.declarations[i], path);

                    const fxnObject = {fxnId: dec.declarations[i].id.name, calls: callList, loops: loopList};
                    fxnList.push(fxnObject);
                } else {
                    // for adding imports
                    let callList = traverseNode(dec, path);
                    // function calls could be part of Variable declaration
                    fxnCalls = fxnCalls.concat(callList);
                }
            }
        } else {
            let callList = traverseNode(dec, path);
            let loopList = findForLoop(dec, path);
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

        out += `subgraph ${filename};`;

        for (let j = 0; j < result[i]["children"].length; j++) {
            let fxnId = `${filename}:${result[i]["children"][j]["fxnId"]}`
            out += fxnId + ";";
            for (let k = 0; k < result[i]["children"][j]["calls"].length; k++) {
                console.log(result[i]["children"][j]["calls"][k])
                let callname = result[i]["children"][j]["calls"][k];
                if (callname.split(":")[0] == filename) { // belongs under the same graph
                    out += `${fxnId} --> ${callname};`; 
                }
            }
        }
        out += "end;"
    }

    // Creating connections between subgraphs
    for (let i = 0; i < result.length; i++) {
        let filename = result[i]["name"];

        for (let j = 0; j < result[i]["children"].length; j++) {
            let fxnId = `${filename}:${result[i]["children"][j]["fxnId"]}`
            for (let k = 0; k < result[i]["children"][j]["calls"].length; k++) {
                let callname = result[i]["children"][j]["calls"][k];
                if (callname.split(":")[0] != filename) { // belongs under the same graph
                    out += `${fxnId} --> ${callname};`; 
                }
            }
        }

        for (let j = 0; j < result[i]["calls"].length; j++) {
            let callname = result[i]["calls"][j];
            out += `${filename} --> ${callname};`; 
        }
    }

    return out;
} 

console.log("\n\n\n\n\nStarting...")

// example usage
let res;

res = getFileStruc("../../Shawntesting/");
console.log("Declarations: " + JSON.stringify(fxnDec));
console.log("Exports: " + JSON.stringify(fxnExports));
console.log("Results: " + JSON.stringify(res));
console.log("Mermaid: " + parseToMermaid(res));

// espree.VisitorKeys

module.exports = {
    getFileStruc: getFileStruc,
    parseToMermaid: parseToMermaid
};

