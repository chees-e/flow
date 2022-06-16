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

let fxnDec = {};
let fxnExports = {};

function getAllDec(path) {
    let fileExports = {};
    let file = fs.readFileSync(path, "utf8");
    let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    functionArg.body.forEach ( dec => {
        if (dec.type === "FunctionDeclaration"){
            if (dec.id && dec.id.name in fxnDec) {
                fxnDec[dec.id.name]["sources"].push(file);
            } else {
                fxnDec[dec.id.name] = {"sources": [path]};
            }
        } else if (dec.type == "VariableDeclaration") {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type == "ArrowFunctionExpression") {
                    if (dec.declarations[i].id && dec.declarations[i].id.name in fxnDec) {
                        fxnDec[dec.declarations[i].id.name]["sources"].push(file);
                    } else if (dec.declarations[i].id) {
                        fxnDec[dec.declarations[i].id.name] = {"sources": [path]};
                    }
                }
            }
        } else if (dec.type == "ExpressionStatement" && dec.expression.type == "AssignmentExpression") {
            if (dec.expression.left.property && dec.expression.left.property.name == "exports") {
                if (dec.expression.right.type == "ObjectExpression") {
                    fileExports = {}; // Everything before is now overridden;
                    for (let i = 0; i < dec.expression.right.properties.length; i++) {
                        if (dec.expression.right.properties[i].value.name in fxnDec) { // function must be declared before
                            fileExports[dec.expression.right.properties[i].key.name] = dec.expression.right.properties[i].value.name;
                        }
                    }
                }
            } else if (dec.expression.left.object && dec.expression.left.object.object && dec.expression.left.object.object.name == "module") {
                if (dec.expression.left.object.property.name == "exports" && dec.expression.right.type == "Identifier") {
                    if (dec.expression.right.name in fxnDec) { // function must be declared before
                        fileExports[dec.expression.left.property.name] = dec.expression.right.name;
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
    
    getFilesRecursively(dir);

    // Get all declared functions
    files.forEach(path => {
        if (path.endsWith(".js") && !path.replaceAll("\\", "/").replace(/^(\/)/, "").split('/').reverse()[0].startsWith(".")){
            console.log("Finding functions in "+ path);
            fileExports = getAllDec(path);
            fxnExports[path] = fileExports;
        }
    })

    console.log("Declarations: " + JSON.stringify(fxnDec));
    console.log("Exports: " + JSON.stringify(fxnExports));

    // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript
    files.forEach(path => {
        path.replace(dir, "root/").replaceAll("\\", "/").replaceAll("//", "/").replace(/^(\/)/, "").split('/').reduce((r, name) => {
            if (!r[name]) {
                r[name] = {result: []};
                if (name.endsWith(".js") && !path.replaceAll("\\", "/").replace(/^(\/)/, "").split('/').reverse()[0].startsWith(".")){
                    console.log("entering " + name);
                    let fileFunctions = assignFileFunction(path);
                    r.result.push({name, children: fileFunctions[0], calls: fileFunctions[1], exports: fxnExports[path]});
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
    console.log(result)
    // output = result
    return (result);
}

function traverseNode(dec) {
    let callList = [];
    try {
        estraverse.traverse(dec, {
            enter: function (node, parent) {
                if (node.type == 'CallExpression') {
                    if (node.callee.type === "MemberExpression" && node.callee.property.name in fxnDec){
                        if (node.callee.object.hasOwnProperty('name')){
                            console.log("Adding " + node.callee.object.name + '.' +node.callee.property.name);
                            callList.push(node.callee.object.name + '.' +node.callee.property.name);
                        } else {
                            console.log("Adding: " + node.callee.property.name);
                            callList.push(node.callee.property.name);
                        }
                    } else if (node.callee.name in fxnDec) {
                        console.log("Adding " + node.callee.name);
                        callList.push(node.callee.name);
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
    let file = fs.readFileSync(path, "utf8");
    let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
    functionArg.body.forEach ( dec => {
        console.log("AST: " + dec.type)
        if (dec.type === "FunctionDeclaration"){
            // TODO: add error handling
            let callList = [];
            
            callList = traverseNode(dec);
            const fxnObject = {fxnId: dec.id.name, calls: callList};
            fxnList.push(fxnObject);
        } else if (dec.type == "VariableDeclaration" ) {
            for (let i = 0; i < dec.declarations.length; i++) {
                if (dec.declarations[i].init && dec.declarations[i].init.type == "ArrowFunctionExpression") {
                    let callList = traverseNode(dec.declarations[i]);

                    const fxnObject = {fxnId: dec.declarations[i].id.name, calls: callList};
                    fxnList.push(fxnObject);
                }
            }
        } else {
            let callList = traverseNode(dec);
            fxnCalls = fxnCalls.concat(callList);
        }
    })
    return [fxnList, fxnCalls];
}

console.log("\n\n\n\n\nStarting...")

// example usage
let res;
res = getFileStruc("..\\..\\Shawntesting\\");
console.log(JSON.stringify(res));
// espree.VisitorKeys


