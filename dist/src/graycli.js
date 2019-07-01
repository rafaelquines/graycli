"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_utils_1 = require("./lib/url-utils");
const file_utils_1 = require("./lib/file-utils");
const graylog_api_service_1 = require("./services/graylog-api.service");
const inquirer = require("inquirer");
const sprintf_js_1 = require("sprintf-js");
const chalk = require("chalk");
class GrayCli {
    constructor(cmdOptions) {
        this.userDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.graycli';
        this.tokenFilename = this.userDir + '/tokens.json';
        this.cacheFilename = this.userDir + '/cache.json';
        this.authHeaderFormat = "Basic %(token)s";
        this.pageSize = 100;
        this.fields = "_id,timestamp,container_name,message,source";
        this.sort = "timestamp:asc";
        this.messageIds = [];
        this.url = '';
        this.username = '';
        this.password = '';
        this.cache = [];
        this.authHeader = '';
        this.cmdOptions = cmdOptions;
        file_utils_1.FileUtils.createUserDir(this.userDir);
        this.tokens = file_utils_1.FileUtils.readTokenFile(this.tokenFilename);
        this.cache = file_utils_1.FileUtils.readCacheFile(this.cacheFilename);
    }
    getLogs(graylogApi, streamId) {
        let resultMessageIds = [];
        const filter = "streams:" + streamId;
        this.showDebug("Requesting search/relative. Range: " + this.cmdOptions.range);
        return graylogApi.searchRelative(this.cmdOptions.query, this.cmdOptions.range, this.pageSize, 0, filter, this.fields, this.sort, this.cmdOptions.debug)
            .then((res) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.showDebug("Response search/relative. Messages: " + res.messages.length);
                resultMessageIds = res.messages.map((item) => item.message._id);
                this.handleMessages(res.messages);
                const totalCount = res.total_results;
                const nPages = Math.ceil(totalCount / this.pageSize) - 1;
                for (let i = 0; i < nPages; i++) {
                    this.showDebug("Requesting search/absolute. Offset: " + (i + 1) * this.pageSize + " Limit: " + this.pageSize);
                    const resLogs = yield graylogApi.searchAbsolute(this.cmdOptions.query, res.from, res.to, this.pageSize, (i + 1) * this.pageSize, filter, this.fields, this.sort, this.cmdOptions.debug);
                    this.showDebug("Response search/absolute. Messages: " + resLogs.messages.length);
                    resultMessageIds = [...resultMessageIds, ...resLogs.messages.map((item) => item.message._id)];
                    this.handleMessages(resLogs.messages);
                }
                this.removeOldMsgs(resultMessageIds);
                this.showDebug("Awaiting " + (this.cmdOptions.interval * 1000) + " seconds.");
                setTimeout(() => {
                    this.getLogs(graylogApi, streamId);
                }, this.cmdOptions.interval * 1000);
            }
            catch (e) {
                this.showError(e);
            }
        }))
            .catch((err) => this.showError(err));
    }
    validateUrl(url) {
        return Promise.resolve(url_utils_1.UrlUtils.isAccessible(url));
    }
    validateRequired(value) {
        return value ? true : "Invalid";
    }
    validatePassword(password) {
        if (!password) {
            return "Invalid password";
        }
        else {
            const graylogApi = new graylog_api_service_1.GraylogApi(this.url, sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + password).toString('base64') }));
            return Promise.resolve(graylogApi.system())
                .then(() => {
                return true;
            }).catch((err) => {
                if (err.error) {
                    return "Error: " + err.error;
                }
                else {
                    return "Invalid username or password";
                }
            });
        }
    }
    normalizeUrl(url) {
        url = url.endsWith("/") ? url.substr(0, url.length - 1) : url;
        url = url.endsWith("/api") ? url.substr(0, url.length - "/api".length) : url;
        return url;
    }
    collectInputs() {
        return __awaiter(this, void 0, void 0, function* () {
            this.url = this.cmdOptions.url;
            this.username = this.cmdOptions.username;
            // URL
            if (!this.url) {
                if (this.cache.length <= 1) {
                    const urlAnswer = yield inquirer.prompt({
                        name: "url",
                        type: "input",
                        message: "Graylog URL:",
                        validate: (inp) => this.validateUrl(inp),
                        default: this.cache.length === 1 ? this.cache[0].url : undefined
                    });
                    this.url = this.normalizeUrl(urlAnswer.url);
                }
                else {
                    const serverList = this.cache.map(item => item.url)
                        .filter((value, index, self) => self.indexOf(value) === index);
                    serverList.push("New URL");
                    let urlAnswer = yield inquirer.prompt({
                        name: 'url',
                        type: 'list',
                        choices: serverList,
                        message: 'Select Graylog URL:',
                    });
                    if (urlAnswer.url.indexOf("New") >= 0) {
                        urlAnswer = yield inquirer.prompt({
                            name: "url",
                            type: "input",
                            message: "Graylog URL:",
                            validate: (inp) => this.validateUrl(inp)
                        });
                    }
                    this.url = this.normalizeUrl(urlAnswer.url);
                }
            }
            else {
                this.url = this.normalizeUrl(this.url);
                const urlValid = yield this.validateUrl(this.url);
                if (urlValid !== true) {
                    this.showError("Invalid Graylog Url");
                }
            }
            // Username
            if (!this.username) {
                const users = this.cache.filter((item) => item.url === this.url);
                if (users.length <= 1) {
                    const usernameAnswer = yield inquirer.prompt({
                        name: "username",
                        type: "input",
                        message: "Username:",
                        validate: (inp) => this.validateRequired(inp),
                        default: users.length === 1 ? users[0].username : undefined
                    });
                    this.username = usernameAnswer.username;
                }
                else {
                    const userList = users.map((item) => item.username)
                        .filter((value, index, self) => self.indexOf(value) === index);
                    userList.push("New Username");
                    let usernameAnswer = yield inquirer.prompt({
                        name: 'username',
                        type: 'list',
                        choices: userList,
                        message: 'Select Username:',
                    });
                    if (usernameAnswer.username.indexOf("New") >= 0) {
                        usernameAnswer = yield inquirer.prompt({
                            name: "username",
                            type: "input",
                            message: "Username:",
                            validate: (inp) => this.validateRequired(inp)
                        });
                    }
                    this.username = usernameAnswer.username;
                }
            }
            // Token
            const token = this.tokens.find((t) => t.username === this.username && t.url === this.url);
            if (!token) {
                const passwordAnswer = yield inquirer.prompt({
                    name: 'password',
                    type: 'password',
                    message: 'Password:',
                    validate: (inp) => this.validatePassword(inp),
                    mask: '*'
                });
                this.password = passwordAnswer.password;
                const graylogApi = new graylog_api_service_1.GraylogApi(this.url, sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') }));
                const canCreateToken = yield graylogApi.permissionsCan(this.username, "users:tokencreate");
                if (canCreateToken) {
                    const wantTokenAnswer = yield inquirer.prompt({
                        name: 'wantToken',
                        type: 'confirm',
                        message: 'Do you want to generate a token?'
                    });
                    if (wantTokenAnswer.wantToken) {
                        try {
                            const tokenRes = yield graylogApi.createToken(this.username, "graycli");
                            if (tokenRes.token) {
                                console.log("Token successfully generated");
                            }
                            this.tokens.push({
                                url: this.url,
                                username: this.username,
                                token: tokenRes.token
                            });
                            file_utils_1.FileUtils.writeTokenFile(this.tokenFilename, this.tokens);
                            this.authHeader = sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(tokenRes.token + ":token").toString('base64') });
                        }
                        catch (e) {
                            console.log("Could not to generate token");
                            this.authHeader = sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
                        }
                    }
                    else {
                        this.authHeader = sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
                    }
                }
                else {
                    this.authHeader = sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(this.username + ":" + this.password).toString('base64') });
                }
            }
            else {
                this.authHeader = sprintf_js_1.sprintf(this.authHeaderFormat, { token: Buffer.from(token.token + ":token").toString('base64') });
            }
        });
    }
    start() {
        let graylogApi;
        this.collectInputs()
            .then(() => {
            graylogApi = new graylog_api_service_1.GraylogApi(this.url, this.authHeader);
            return this.listStreams(graylogApi);
        })
            .then((streamId) => {
            this.getLogs(graylogApi, streamId);
        });
    }
    updateCache(selectedStream) {
        const streamsCache = this.cache.filter((item) => item.url === this.url && item.username === this.username);
        if (streamsCache.length === 0) {
            this.cache.push({
                url: this.url,
                username: this.username,
                stream: selectedStream
            });
        }
        else if (streamsCache.length === 1) {
            const streamCache = streamsCache[0];
            streamCache.stream = selectedStream;
        }
        file_utils_1.FileUtils.writeCacheFile(this.cacheFilename, this.cache);
    }
    listStreams(graylogApi) {
        this.showDebug("Listing streams");
        return graylogApi.streams()
            .then((streams) => {
            if (streams.streams.length === 1) {
                return Promise.resolve({ stream: streams.streams[0].id + "#:#" + streams.streams[0].title });
            }
            else {
                const streamCache = this.cache.find((item) => item.url === this.url && item.username === this.username);
                const streamList = streams.streams.map((s) => {
                    return { name: s.title + " (" + s.description + ")", value: s.id + "#:#" + s.title };
                });
                return inquirer.prompt({
                    name: 'stream',
                    type: 'list',
                    choices: streamList,
                    message: 'Select stream:',
                    default: streamCache ? streamCache.stream : undefined
                });
            }
        })
            .then((answer) => {
            const splitStream = answer.stream.split("#:#");
            const streamId = splitStream[0];
            const title = splitStream[1];
            this.updateCache(answer.stream);
            console.log("Monitoring stream [" + title + "]...");
            return Promise.resolve(streamId);
        })
            .catch((err) => {
            this.showError(err);
            return "";
        });
    }
    showError(err) {
        console.log("Error: " + err);
        process.exit(1);
    }
    showDebug(msg) {
        if (this.cmdOptions.debug) {
            console.debug(msg);
        }
    }
    removeOldMsgs(lastResult) {
        const noMoreIds = this.messageIds.filter((x) => !lastResult.includes(x));
        this.showDebug("Removing old messages: " + noMoreIds.length);
        this.messageIds = this.messageIds.filter((x) => !noMoreIds.includes(x));
    }
    handleMessages(messages) {
        const msgIds = messages.map((item) => {
            return item.message._id;
        });
        const diffIds = msgIds.filter((x) => !this.messageIds.includes(x));
        this.showDebug("Found " + diffIds.length + " new messages");
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
            if (!this.cmdOptions.filter || msg.indexOf(this.cmdOptions.filter) !== -1) {
                console.log(msg);
            }
        });
    }
}
exports.GrayCli = GrayCli;
//# sourceMappingURL=graycli.js.map