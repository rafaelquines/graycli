import * as rp from 'request-promise';
export declare class GraylogApi {
    private graylogUrlApi;
    private username;
    private password;
    private readonly searchRelativeApi;
    private readonly systemApi;
    private readonly basicAuthToken;
    constructor(graylogUrlApi: string, username: string, password: string);
    searchRelative(query: string, range: number, limit?: number, offset?: number, filter?: string, fields?: string, sort?: string): rp.RequestPromise;
    system(): rp.RequestPromise;
}
