const chalk = require('chalk');
function benchmarkResultsToConsole(suite){
    console.log("\n");
    console.log("==================");
    console.log("Benchmark results:");
    console.log("------------------");
    var bench;
    for(var testNo = 0; testNo < suite.length; testNo++){
        bench = suite[testNo];
        console.log(chalk.green.underline(bench.name) +
            "\n Ops/sec: " + chalk.bold.magenta(bench.hz.toFixed(bench.hz < 100 ? 2 : 0)) +
                chalk.dim(' ±' + bench.stats.rme.toFixed(2) + '% ') +
                chalk.gray('Ran ' + bench.count + ' times in ' +
                bench.times.cycle.toFixed(3) + ' seconds.'));
    }
    console.log("===================");
}
if (typeof exports !== "undefined") {
    exports.benchmarkResultsToConsole = benchmarkResultsToConsole;
}
