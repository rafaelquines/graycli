#!/usr/bin/env node
import { GraylogApi } from './services/graylog-api.service';
import { FileUtils } from './lib/file-utils';
import { UserConfig } from './models/user-config';
import * as commander from 'commander';
import * as rp from 'request-promise';
import * as fs from 'fs';
import { GrayCli } from './graycli';

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

const grayCli = new GrayCli(commander);
grayCli.start();