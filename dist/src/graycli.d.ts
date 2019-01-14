import { GraylogApi } from "./services/graylog-api.service";
import { CommanderStatic } from "commander";
import * as Bluebird from 'bluebird';
export declare class GrayCli {
    private readonly configDir;
    private readonly configFilename;
    messageIds: string[];
    cmdOptions: any;
    constructor(cmdOptions: CommanderStatic);
    private parseUrl;
    private getConfig;
    private saveToConfig;
    private callApi;
    start(): void;
    listStreams(graylogApi: GraylogApi): Bluebird<any>;
    private showError;
    showServerInfo(graylogApi: GraylogApi): Bluebird<void>;
    handleMessages(messages: any[], filter: string): Promise<any>;
}
