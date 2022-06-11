const fs = require('fs');
const path = require("path");
const glob = require("glob");

// https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
var getDirectories = function (src, callback) {
    glob(src + '/**/*', callback);
};

async function getFileStruc(folder, callback) {
    let result = [];
    let level = {result};
    return getDirectories(folder, function (err, res) {
        if (err) {
            console.log('Error', err);
        } else {
            // console.log(res);
        }
        // https://stackoverflow.com/questions/57344694/create-a-tree-from-a-list-of-strings-containing-paths-of-files-javascript
        res.forEach(path => {
            path.replace(/^(\/)/,"").split('/').reduce((r, name) => {
                if(!r[name]) {
                    r[name] = {result: []};
                    r.result.push({name, children: r[name].result})
                }
                return r[name];
            }, level)
        })
        //console.log(result)
        // output = result
        return callback(result);
    });
}

// // example usage
// getFileStruc('../',function(response){
//     let test = response
//     console.log(test);
// })

