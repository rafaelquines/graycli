#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const graycli_1 = require("./graycli");
commander
    .version('0.0.1', '-v, --version')
    .option('--api-host <host>', 'Graylog API Hostname', "127.0.0.1")
    .option('--api-port <port>', 'Graylog API Port', '9000')
    .option('--api-path <path>', 'Graylog API Path', "/api/")
    .option('--api-protocol <protocol>', 'Graylog API Protocol', "http")
    .option('-u, --username <username>', 'Graylog API Username')
    .option('-p, --password <password>', 'Graylog API Password')
    .option('-i, --interval <interval>', 'Polling interval in seconds', 3)
    .option('-f, --filter <filter>', 'Search string')
    .option('-s, --save <config_name>', 'Save config')
    .option('-c, --config <config_name>', 'Load saved config')
    .parse(process.argv);
const grayCli = new graycli_1.GrayCli(commander);
grayCli.start();
//# sourceMappingURL=app.js.map