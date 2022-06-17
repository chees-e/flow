function func(a) {
    return a + 10;

}

// forbidden: exporting arrow function
module.exports.func2 = () => {
    console.log("test");
}

// forbidden: function aliasing
const func3 = func;

// This overrides the privious exports
module.exports = {
    myfunction : func,
    myfunction4 : func4
}

// forbidden: declaration after exports
function func4() {
    return;
}