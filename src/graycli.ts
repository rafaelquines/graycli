import { FileUtils } from "./lib/file-utils";
import { GraylogApi } from "./services/graylog-api.service";
import { UserConfig } from "./models/user-config";
import { CommanderStatic } from "commander";
import * as Bluebird from 'bluebird';

export class GrayCli {
  private readonly configDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.graycli';
  private readonly configFilename = this.configDir + '/config.json';
  messageIds: string[] = [];
  cmdOptions: any;

  constructor(cmdOptions: CommanderStatic) {
    // console.log(process.argv);
    if (process.argv.length <= 2) {
      cmdOptions.outputHelp();
      process.exit(0);
    }
    this.cmdOptions = cmdOptions;
    if (cmdOptions.save) {
      this.saveToConfig(cmdOptions);
    } else if (cmdOptions.config) {
      this.cmdOptions = this.getConfig(cmdOptions.config);
    }
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

  private callApi(graylogApi: GraylogApi) {
    graylogApi.searchRelative('*', 10, undefined, undefined, undefined, '_id,timestamp,container_name,message,source',
      'timestamp:asc')
      .then((res) => {
        return this.handleMessages(res.messages, this.cmdOptions.filter);
      })
      .then(() => {
        setTimeout(() => {
          this.callApi(graylogApi);
        }, this.cmdOptions.interval * 1000);
      })
      .catch((err) => {
        console.log("Error: " + err.statusCode);
        process.exit(1);
      });
  }

  start() {
    const graylogApi: GraylogApi = new GraylogApi(this.cmdOptions.apiProtocol + "://"
      + this.cmdOptions.apiHost + ":" + this.cmdOptions.apiPort + this.cmdOptions.apiPath,
      this.cmdOptions.username, this.cmdOptions.password);
    this.showServerInfo(graylogApi)
      .then(() => {
        this.callApi(graylogApi);
      });
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
        return Promise.resolve();
      })
      .catch((err) => {
        console.log(err);
        console.log("Error: " + err.statusCode);
        process.exit(1);
      });
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