import * as rp from 'request-promise';
import * as Bluebird from 'bluebird';
export declare class GraylogApi {
    private authHeader;
    private readonly searchRelativeApi;
    private readonly systemApi;
    private readonly streamsApi;
    private readonly userInfoApi;
    private readonly listTokensApi;
    private readonly createTokenApi;
    private graylogUrlApi;
    constructor(graylogUrl: string, authHeader: string);
    listTokens(username: string): rp.RequestPromise;
    createToken(username: string, tokenName: string): rp.RequestPromise;
    searchRelative(query: string, range: number, limit?: number, offset?: number, filter?: string, fields?: string, sort?: string, debug?: boolean): rp.RequestPromise;
    system(): rp.RequestPromise;
    permissionsCan(username: string, permission: string): Bluebird<boolean>;
    streams(): rp.RequestPromise;
    userInfo(username: string): rp.RequestPromise;
}
