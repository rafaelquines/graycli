#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_utils_1 = require("./lib/file-utils");
const commander = require("commander");
const graycli_1 = require("./graycli");
const util = require("util");
const chalk = require("chalk");
const exec = util.promisify(require('child_process').exec);
let packageObj;
if (file_utils_1.FileUtils.exists("./package.json")) {
    packageObj = file_utils_1.FileUtils.readJsonFile("./package.json");
}
else {
    packageObj = file_utils_1.FileUtils.readJsonFile(__dirname + "/../../package.json");
}
const currentVersion = packageObj.version;
exec('npm view ' + packageObj.name + ' version')
    .then((out) => {
    const npmRepoVersion = out.stdout.replace(/\r?\n|\r/g, "");
    try {
        if (currentVersion !== npmRepoVersion) {
            console.log();
            console.log(chalk.default.bold("WARNING"));
            console.log("Update available " + chalk.default.gray(currentVersion) + " => " + chalk.default.green(npmRepoVersion));
            console.log("Run " + chalk.default.cyan("npm i -g " + packageObj.name) + " to update");
            console.log();
        }
    }
    catch (ex) { }
    commander
        .version(currentVersion, '-v, --version')
        .option('--url <url>', 'Graylog URL')
        .option('-u, --username <username>', 'Graylog Username')
        .option('-i, --interval <interval>', 'Polling interval in seconds', 3)
        .option('-r, --range <range>', 'Relative timerange, specified as seconds from now', 60)
        .option('-f, --filter <filter>', 'Search string')
        .option('-d, --debug', 'View debug messages')
        .parse(process.argv);
    const grayCli = new graycli_1.GrayCli(commander);
    grayCli.start();
});
//# sourceMappingURL=app.js.map