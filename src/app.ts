#!/usr/bin/env node
import { UrlUtils } from './lib/url-utils';
import { FileUtils } from './lib/file-utils';
import * as commander from 'commander';
import { GrayCli } from './graycli';
let packageObj;
if (FileUtils.exists("./package.json")) {
  packageObj = FileUtils.readJsonFile("./package.json");
} else {
  packageObj = FileUtils.readJsonFile(__dirname + "/../../package.json");
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

const grayCli = new GrayCli(commander);
grayCli.start();