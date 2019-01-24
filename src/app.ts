#!/usr/bin/env node
import { FileUtils } from './lib/file-utils';
import * as commander from 'commander';
import { GrayCli } from './graycli';
import * as util from 'util';
import * as chalk from 'chalk';

const exec = util.promisify(require('child_process').exec);
let packageObj: any;
if (FileUtils.exists("./package.json")) {
  packageObj = FileUtils.readJsonFile("./package.json");
} else {
  packageObj = FileUtils.readJsonFile(__dirname + "/../../package.json");
}
const currentVersion = packageObj.version;
exec('npm view ' + packageObj.name + ' version')
  .then((out: any) => {
    const npmRepoVersion = out.stdout.replace(/\r?\n|\r/g, " ");
    try {
      if (currentVersion !== npmRepoVersion) {
        console.log(chalk.default.bold("WARNING"));
        console.log("Update available " + chalk.default.gray(currentVersion) + " => " + chalk.default.green(npmRepoVersion));
        console.log("Run " + chalk.default.cyan("npm i -g " + packageObj.name) + " to update");
        console.log();
      }
    } catch (ex) { }
    commander
      .version(currentVersion, '-v, --version')
      .option('--url <url>', 'Graylog URL')
      .option('-u, --username <username>', 'Graylog Username')
      .option('-i, --interval <interval>', 'Polling interval in seconds', 3)
      .option('-r, --range <range>', 'Relative timerange, specified as seconds from now', 60)
      .option('-f, --filter <filter>', 'Search string')
      .option('-d, --debug', 'View debug messages')
      .parse(process.argv);
    const grayCli = new GrayCli(commander);
    grayCli.start();
  });

