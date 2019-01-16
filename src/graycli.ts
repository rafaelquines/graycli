import { UserCache } from './models/user-cache';
import { UrlUtils } from './lib/url-utils';
import { Streams } from './models/streams';
import { FileUtils } from "./lib/file-utils";
import { GraylogApi } from "./services/graylog-api.service";
import { CommanderStatic } from "commander";
import * as Bluebird from 'bluebird';
import * as inquirer from 'inquirer';
import { InquirerListItem } from './models/inquirer-list-item';
import { UserToken } from './models/user-token';
import { sprintf } from 'sprintf-js';
import * as chalk from 'chalk';

export class GrayCli {
  private readonly userDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.graycli';
  private readonly tokenFilename = this.userDir + '/tokens.json';
  private readonly cacheFilename = this.userDir + '/cache.json';
  private readonly authHeaderFormat = "Basic %(token)s";
  messageIds: string[] = [];
  cmdOptions: any;
  url = '';
  username = '';
  password = '';
  tokens: UserToken[];
  cache: UserCache = {};
  authHeader = '';
  constructor(cmdOptions: CommanderStatic) {
    this.cmdOptions = cmdOptions;
    FileUtils.createUserDir(this.userDir);
    this.tokens = FileUtils.readTokenFile(this.tokenFilename);
    this.cache = FileUtils.readCacheFile(this.cacheFilename);
  }

  private callApi(graylogApi: GraylogApi, streamId: string) {
    if (this.cmdOptions.debug) {
      console.debug("Calling searchRelative...");
    }
    graylogApi.searchRelative('*', this.cmdOptions.range, 500, 0, "streams:" + streamId, '_id,timestamp,container_name,message,source',
      'timestamp:asc', this.cmdOptions.debug)
      .then((res) => {
        if (this.cmdOptions.debug) {
          console.debug("Response searchRelative (" + res.messages.length + " messages)");
        }
        return this.handleMessages(res.messages, this.cmdOptions.filter);
      })
      .then(() => {
        setTimeout(() => {
          this.callApi(graylogApi, streamId);
        }, this.cmdOptions.interval * 1000);
      })
      .catch((err) => this.showError(err));
  }

  private validateUrl(url: string) {
    return Promise.resolve(UrlUtils.isAccessible(url));
  }

  private validateRequired(value: string) {
    return value ? true : "Invalid";
  }

  private validatePassword(password: string) {
    if (!password) {
      return "Invalid password";
    } else {
      const graylogApi: GraylogApi = new GraylogApi(this.url, sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + password).toString('base64') }));
      return Promise.resolve(graylogApi.system())
        .then(() => {
          return true;
        }).catch(() => {
          return "Invalid username or password";
        });
    }
  }

  private normalizeUrl(url: string) {
    url = url.endsWith("/") ? url.substr(0, url.length - 1) : url;
    url = url.endsWith("/api") ? url.substr(0, url.length - "/api".length) : url;
    return url;
  }

  async collectInputs() {
    this.url = this.cmdOptions.url;
    this.username = this.cmdOptions.username;

    // URL
    if (!this.url) {
      const urlAnswer: any = await inquirer.prompt({
        name: "url",
        type: "input",
        message: "Graylog URL:",
        validate: (inp) => this.validateUrl(inp),
        default: this.cache.url
      });
      this.url = this.normalizeUrl(urlAnswer.url);
    } else {
      this.url = this.normalizeUrl(this.url);
      const urlValid = await this.validateUrl(this.url);
      if (urlValid !== true) {
        this.showError("Invalid Graylog Url");
      }
    }
    this.cache.url = this.url;
    FileUtils.writeCacheFile(this.cacheFilename, this.cache);

    // Username
    if (!this.username) {
      const usernameAnswer: any = await inquirer.prompt({
        name: "username",
        type: "input",
        message: "Username:",
        validate: (inp) => this.validateRequired(inp),
        default: this.cache.username
      });
      this.username = usernameAnswer.username;
      this.cache.username = this.username;
    }
    this.cache.username = this.username;
    FileUtils.writeCacheFile(this.cacheFilename, this.cache);

    // Token
    const token = this.tokens.find((t) => t.username === this.username && t.url === this.url);
    if (!token) {
      const passwordAnswer: any = await inquirer.prompt({
        name: 'password',
        type: 'password',
        message: 'Password:',
        validate: (inp) => this.validatePassword(inp),
        mask: '*'
      });
      this.password = passwordAnswer.password;
      const graylogApi: GraylogApi = new GraylogApi(this.url, sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') }));
      const canCreateToken = await graylogApi.permissionsCan(this.username, "users:tokencreate");
      if (canCreateToken) {
        const wantTokenAnswer: any = await inquirer.prompt({
          name: 'wantToken',
          type: 'confirm',
          message: 'Do you want generate a token?'
        });
        if (wantTokenAnswer.wantToken) {
          try {
            const tokenRes = await graylogApi.createToken(this.username, "graycli");
            if (tokenRes.token) {
              console.log("Token successfully generated");
            }
            this.tokens.push({
              url: this.url,
              username: this.username,
              token: tokenRes.token
            });
            FileUtils.writeTokenFile(this.tokenFilename, this.tokens);
            this.authHeader = sprintf(this.authHeaderFormat, { token: Buffer.from(tokenRes.token + ":token").toString('base64') });
          } catch (e) {
            console.log("Could not generate token");
            this.authHeader = sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
          }
        } else {
          this.authHeader = sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
        }
      } else {
        this.authHeader = sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
      }
    } else {
      this.authHeader = sprintf(this.authHeaderFormat, { token: Buffer.from(token.token + ":token").toString('base64') });
    }
  }

  start() {
    let graylogApi: GraylogApi;
    this.collectInputs()
      .then(() => {
        graylogApi = new GraylogApi(this.url, this.authHeader);
        return this.listStreams(graylogApi);
      })
      .then((streamId: string) => {
        this.callApi(graylogApi, streamId);
      });
  }

  listStreams(graylogApi: GraylogApi) {
    return graylogApi.streams()
      .then((streams: Streams) => {
        if (streams.streams.length === 1) {
          console.log("Monitoring stream " + streams.streams[0].title + "...");
          return Promise.resolve({ stream: streams.streams[0].id + "#:#" + streams.streams[0].title });
        } else {
          const streamList: InquirerListItem[] = streams.streams.map((s) => {
            return { name: s.title + " (" + s.description + ")", value: s.id + "#:#" + s.title };
          });
          return inquirer.prompt({
            name: 'stream',
            type: 'list',
            choices: streamList,
            message: 'Select stream:',
            default: this.cache.stream
          });
        }
      })
      .then((answer: any) => {
        const splitStream: string[] = answer.stream.split("#:#");
        const streamId = splitStream[0];
        const title = splitStream[1];
        console.log("Monitoring stream " + title + "...");
        this.cache.stream = answer.stream;
        FileUtils.writeCacheFile(this.cacheFilename, this.cache);
        return Promise.resolve(streamId);
      })
      .catch((err) => {
        this.showError(err);
        return "";
      });
  }

  private showError(err: any) {
    console.log("Error: " + err);
    process.exit(1);
  }

  showServerInfo(graylogApi: GraylogApi) {
    return graylogApi.system()
      .then((serverInfo) => {
        console.log("Graylog Server Info:");
        console.log("    Hostname: " + serverInfo.hostname);
        console.log("    Version: " + serverInfo.version);
        console.log("    OS: " + serverInfo.operating_system);
        console.log("    Status: " + serverInfo.lb_status);
        console.log("    Start At: " + serverInfo.started_at);
        console.log("    Cluster Id: " + serverInfo.cluster_id);
        console.log("    Node Id: " + serverInfo.node_id);
        console.log("--------------------------------------------------------------");
        return Promise.resolve();
      })
      .catch((err) => this.showError(err));
  }

  handleMessages(messages: any[], filter: string): Promise<any> {
    const msgIds = messages.map((item) => {
      return item.message._id;
    }) as string[];
    const diffIds: string[] = msgIds.filter((x) => !this.messageIds.includes(x));
    if (this.cmdOptions.debug) {
      console.debug("New messages: " + diffIds.length);
    }
    this.messageIds = [...this.messageIds, ...diffIds];
    messages.filter((x) => diffIds.includes(x.message._id))
      .forEach(el => {
        let msg = '[' + el.message.source + '/' + el.message.container_name + '] ' + el.message.message;
        msg = msg.replace(" info ", chalk.default.green(" info "));
        msg = msg.replace(" INFO ", chalk.default.green(" INFO "));
        msg = msg.replace(" error ", chalk.default.red(" error "));
        msg = msg.replace(" ERROR ", chalk.default.red(" ERROR "));
        msg = msg.replace(" debug ", chalk.default.blue(" debug "));
        msg = msg.replace(" DEBUG ", chalk.default.blue(" DEBUG "));
        msg = msg.replace(" warn ", chalk.default.yellow(" warn "));
        msg = msg.replace(" WARN ", chalk.default.yellow(" WARN "));
        if (!filter || msg.indexOf(filter) !== -1) {
          console.log(msg);
        }
      });
    return Promise.resolve();
  }

}
