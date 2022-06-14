const fs = require('fs');
const path = require("path");
const glob = require("glob");
const esprima = require('esprima');
const espree = require('espree');

// https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
let files = [];
const getFilesRecursively = (directory) => {
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
            // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript
            files.forEach(path => {
                path.replace(/^(\/)/, "").split('/').reduce((r, name) => {
                    if (!r[name]) {
                        r[name] = {result: []};
                        if (name.endsWith(".js")){
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
        // esprima.tokenize('<')
        // let functionArg = espree.parse(file, { tolerant: true , jsx: true});
        let functionArg = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module"});
        functionArg.body.forEach ( dec => {
                if (dec.type === "FunctionDeclaration"){
                    const fxnObject = {fxnId: dec.id.name, body: dec.body}
                    fxnList.push(fxnObject)
                    // console.log(dec.id.name)
                }
            })
       return (fxnList)
    }

// example usage
let res;
res = getFileStruc("../controller/FileStructureObject.js")