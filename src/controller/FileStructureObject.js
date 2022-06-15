const fs = require('fs');
const path = require("path");
const glob = require("glob");
const esprima = require('esprima');
const espree = require('espree');
const estraverse = require('estraverse')

// https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
let files = [];
const getFilesRecursively = (directory) => {
    if (directory.includes("node_modules")) {
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

// Create a nested object from desired folder
    function getFileStruc(dir) {
        let result = [];
        let level = {result};
        if (fs.lstatSync(dir).isDirectory()) {
            getFilesRecursively(dir);
        } else {
            files.push(dir);
        }

        console.log("FILES" + files.join("\n"))
            // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript
            files.forEach(path => {
                path.replace(dir, "root/").replace("//", "/").replace(/^(\/)/, "").split('/').reduce((r, name) => {
                    if (!r[name]) {
                        r[name] = {result: []};
                        if (name.endsWith(".js")){
                            console.log("entering " + name);
                            r.result.push({name, children: assignFileFunction(path)})
                        } else{
                            r.result.push({name, children: r[name].result})
                        }
                    }
                    return r[name];
                }, level)
            })
            console.log(result)
            // output = result
            return (result);
    }

// find .js files in nested object
    function assignFileFunction(path) {
        let fxnList = [];
        let file = fs.readFileSync(path, "utf8");
        let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});
        functionArg.body.forEach ( dec => {
            let callList = [];
                if (dec.type === "FunctionDeclaration"){
                    // TODO: add error handling
                    estraverse.traverse(dec, {
                        enter: function (node, parent) {
                            if (node.type == 'CallExpression')
                                if (node.callee.type === "MemberExpression"){
                                    if (node.callee.object.hasOwnProperty('name')){
                                        console.log(node.callee.object.name + '.' +node.callee.property.name)
                                        callList.push(node.callee.object.name + '.' +node.callee.property.name)
                                    } else {
                                        console.log(node.callee.property.name)
                                        callList.push(node.callee.property.name)
                                    }
                                } else {
                                    console.log(node.callee.name);
                                    callList.push(node.callee.name)
                                }
                        }
                    });
                    const fxnObject = {fxnId: dec.id.name, calls: callList}
                    fxnList.push(fxnObject)
                    // console.log(dec.id.name)
                }
            })
       return (fxnList)
    }

// example usage
let res;
// res = getFileStruc("/Users/UBC/Programs/UBClhd2019/Learn/nwplus-aws-workshop"); //"../controller/FileStructureObject.js")

res = getFileStruc("../");
console.log(JSON.stringify(res));
// espree.VisitorKeys


