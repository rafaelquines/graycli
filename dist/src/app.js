#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_utils_1 = require("./lib/file-utils");
const commander = require("commander");
const graycli_1 = require("./graycli");
let packageObj;
if (file_utils_1.FileUtils.exists("./package.json")) {
    packageObj = file_utils_1.FileUtils.readJsonFile("./package.json");
}
else {
    packageObj = file_utils_1.FileUtils.readJsonFile(__dirname + "/../../package.json");
}
commander
    .version(packageObj.version, '-v, --version')
    .option('--url <url>', 'Graylog URL')
    .option('-u, --username <username>', 'Graylog Username')
    // .option('-p, --password <password>', 'Graylog API Password')
    .option('-i, --interval <interval>', 'Polling interval in seconds', 3)
    .option('-r, --range <range>', 'Relative timerange, specified as seconds from now', 60)
    .option('-f, --filter <filter>', 'Search string')
    // .option('-s, --save <config_name>', 'Save config')
    // .option('-c, --config <config_name>', 'Load saved config')
    .option('-d, --debug', 'View debug messages')
    .parse(process.argv);
const grayCli = new graycli_1.GrayCli(commander);
grayCli.start();
//# sourceMappingURL=app.js.map