"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_utils_1 = require("./lib/file-utils");
const graylog_api_service_1 = require("./services/graylog-api.service");
const inquirer = require("inquirer");
const Url = require("url-parse");
class GrayCli {
    constructor(cmdOptions) {
        this.configDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.graycli';
        this.configFilename = this.configDir + '/config.json';
        this.messageIds = [];
        if (process.argv.length <= 2) {
            cmdOptions.outputHelp();
            process.exit(0);
        }
        if (cmdOptions.apiUrl) {
            cmdOptions = this.parseUrl(cmdOptions);
        }
        this.cmdOptions = cmdOptions;
        if (cmdOptions.save) {
            this.saveToConfig(cmdOptions);
        }
        else if (cmdOptions.config) {
            this.cmdOptions = this.getConfig(cmdOptions.config);
        }
    }
    parseUrl(cmdOptions) {
        const url = new Url(cmdOptions.apiUrl);
        cmdOptions.apiHost = url.hostname;
        cmdOptions.apiProtocol = url.protocol.replace(":", "");
        cmdOptions.apiPath = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
        cmdOptions.apiPort = url.port || (cmdOptions.apiProtocol === 'https' ? 443 : 80);
        return cmdOptions;
    }
    getConfig(name) {
        const configs = file_utils_1.FileUtils.readConfigFile(this.configFilename);
        const config = configs.find(x => x.name === name);
        if (config) {
            return config;
        }
        else {
            console.log("Config " + name + " not found");
            process.exit(1);
            return null;
        }
    }
    saveToConfig(cmdOptions) {
        file_utils_1.FileUtils.createConfigDir(this.configDir);
        const configs = file_utils_1.FileUtils.readConfigFile(this.configFilename);
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
        }
        else {
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
        file_utils_1.FileUtils.writeConfigFile(this.configFilename, configs);
    }
    callApi(graylogApi, streamId) {
        graylogApi.searchRelative('*', 10, undefined, undefined, "streams:" + streamId, '_id,timestamp,container_name,message,source', 'timestamp:asc')
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
        const graylogApi = new graylog_api_service_1.GraylogApi(this.cmdOptions.apiProtocol + "://"
            + this.cmdOptions.apiHost + ":" + this.cmdOptions.apiPort + this.cmdOptions.apiPath, this.cmdOptions.username, this.cmdOptions.password);
        this.showServerInfo(graylogApi)
            .then(() => {
            return this.listStreams(graylogApi);
        })
            .then((streamId) => {
            this.callApi(graylogApi, streamId);
        });
    }
    listStreams(graylogApi) {
        return graylogApi.streams()
            .then((streams) => {
            if (streams.streams.length === 1) {
                console.log("Monitoring stream " + streams.streams[0].title + "...");
                return Promise.resolve({ stream: streams.streams[0].id });
            }
            else {
                const streamList = streams.streams.map((s) => {
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
            .then((answer) => {
            return Promise.resolve(answer.stream);
        })
            .catch((err) => this.showError(err));
    }
    showError(err) {
        console.log("Error: " + err);
        process.exit(1);
    }
    showServerInfo(graylogApi) {
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
    handleMessages(messages, filter) {
        const msgIds = messages.map((item) => {
            return item.message._id;
        });
        const diffIds = msgIds.filter((x) => !this.messageIds.includes(x));
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
exports.GrayCli = GrayCli;
//# sourceMappingURL=graycli.js.map