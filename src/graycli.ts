import { Streams } from './models/streams';
import { FileUtils } from "./lib/file-utils";
import { GraylogApi } from "./services/graylog-api.service";
import { UserConfig } from "./models/user-config";
import { CommanderStatic } from "commander";
import * as Bluebird from 'bluebird';
import * as inquirer from 'inquirer';
import * as Url from 'url-parse';
import { InquirerListItem } from './models/inquirer-list-item';

export class GrayCli {
  private readonly configDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.graycli';
  private readonly configFilename = this.configDir + '/config.json';
  messageIds: string[] = [];
  cmdOptions: any;

  constructor(cmdOptions: CommanderStatic) {
    if (process.argv.length <= 2) {
      cmdOptions.outputHelp();
      process.exit(0);
    }
    if (cmdOptions.apiUrl) {
      cmdOptions = this.parseUrl(cmdOptions);
      this.cmdOptions = cmdOptions;
    }
    if (cmdOptions.save) {
      this.saveToConfig(cmdOptions);
    } else if (cmdOptions.config) {
      this.cmdOptions = this.getConfig(cmdOptions.config);
    }
  }

  private parseUrl(cmdOptions: CommanderStatic) {
    const url = new Url(cmdOptions.apiUrl);
    cmdOptions.apiHost = url.hostname;
    cmdOptions.apiProtocol = url.protocol.replace(":", "");
    cmdOptions.apiPath = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
    cmdOptions.apiPort = url.port || (cmdOptions.apiProtocol === 'https' ? 443 : 80);
    return cmdOptions;
  }

  private getConfig(name: string) {
    const configs = FileUtils.readConfigFile(this.configFilename);
    const config = configs.find(x => x.name === name);
    if (config) {
      return config;
    } else {
      console.log("Config " + name + " not found");
      process.exit(1);
      return null;
    }
  }

  private saveToConfig(cmdOptions: any) {
    FileUtils.createConfigDir(this.configDir);
    const configs: UserConfig[] = FileUtils.readConfigFile(this.configFilename);
    let currentConfig = configs.find((x) => x.name === cmdOptions.save);
    if (currentConfig) {
      currentConfig.apiHost = cmdOptions.apiHost;
      currentConfig.apiPort = cmdOptions.apiPort;
      currentConfig.apiPath = cmdOptions.apiPath;
      currentConfig.apiProtocol = cmdOptions.apiProtocol;
      currentConfig.username = cmdOptions.username;
      currentConfig.password = cmdOptions.password;
      currentConfig.interval = cmdOptions.interval;
      currentConfig.filter = cmdOptions.filter;
    } else {
      currentConfig = {
        apiHost: cmdOptions.apiHost,
        apiPort: cmdOptions.apiPort,
        apiPath: cmdOptions.apiPath,
        apiProtocol: cmdOptions.apiProtocol,
        username: cmdOptions.username,
        password: cmdOptions.password,
        interval: cmdOptions.interval,
        filter: cmdOptions.filter,
        name: cmdOptions.save
      };
      configs.push(currentConfig);
    }
    FileUtils.writeConfigFile(this.configFilename, configs);
  }

  private callApi(graylogApi: GraylogApi, streamId: string) {
    graylogApi.searchRelative('*', 10, undefined, undefined, "streams:" + streamId, '_id,timestamp,container_name,message,source',
      'timestamp:asc')
      .then((res) => {
        return this.handleMessages(res.messages, this.cmdOptions.filter);
      })
      .then(() => {
        setTimeout(() => {
          this.callApi(graylogApi, streamId);
        }, this.cmdOptions.interval * 1000);
      })
      .catch((err) => this.showError(err));
  }

  start() {
    const graylogApi: GraylogApi = new GraylogApi(this.cmdOptions.apiProtocol + "://"
      + this.cmdOptions.apiHost + ":" + this.cmdOptions.apiPort + this.cmdOptions.apiPath,
      this.cmdOptions.username, this.cmdOptions.password);
    this.showServerInfo(graylogApi)
      .then(() => {
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
          return Promise.resolve({ stream: streams.streams[0].id });
        } else {
          const streamList: InquirerListItem[] = streams.streams.map((s) => {
            return { name: s.title + " (" + s.description + ")", value: s.id };
          });
          return inquirer.prompt({
            name: 'stream',
            type: 'list',
            choices: streamList,
            message: 'Select stream:'
          });
        }
      })
      .then((answer: any) => {
        return Promise.resolve(answer.stream);
      })
      .catch((err) => this.showError(err));
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
    this.messageIds = [...this.messageIds, ...diffIds];
    messages.filter((x) => diffIds.includes(x.message._id))
      .forEach(el => {
        const msg = '[' + el.message.source + '/' + el.message.container_name + '] ' + el.message.message;
        if (!filter || msg.indexOf(filter) !== -1) {
          console.log(msg);
        }
      });
    return Promise.resolve();
  }

}