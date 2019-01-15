import * as rp from 'request-promise';
import { sprintf } from 'sprintf-js';

export class GraylogApi {
  private readonly searchRelativeApi = "/search/universal/relative";
  private readonly systemApi = "/system";
  private readonly streamsApi = "/streams";
  private readonly listTokensApi = "/users/%(username)s/tokens";
  private readonly createTokenApi = "/users/%(username)s/tokens/%(name)s";
  private graylogUrlApi: string;
  
  constructor(graylogUrl: string, private authHeader: string) {
    this.graylogUrlApi = graylogUrl + (graylogUrl.endsWith("/") ? "" : "/") + "api";
  }

  listTokens(username: string) {
    const options: rp.Options = {
      url: this.graylogUrlApi + sprintf(this.listTokensApi, { username }),
      json: true,
      headers: {
        Authorization: this.authHeader
      }
    };
    return rp(options);
  }

  createToken(username: string, tokenName: string) {
    const options: rp.Options = {
      method: 'POST',
      url: this.graylogUrlApi + sprintf(this.createTokenApi, { username, name: tokenName }),
      json: true,
      headers: {
        Authorization: this.authHeader,
        "X-Requested-By": "graycli" 
      }
    };
    return rp(options);
  }

  searchRelative(query: string, range: number, limit?: number, offset?: number, filter?: string, fields?: string, sort?: string, debug = false) {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.searchRelativeApi,
      qs: {
        query,
        range,
        limit,
        offset,
        filter,
        fields,
        sort
      },
      json: true,
      headers: {
        Authorization: this.authHeader
      }
    };
    if (debug) {
      console.debug(options.url);
      console.debug(options.qs);
      console.debug(options.headers);
    }
    return rp(options);
  }

  system() {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.systemApi,
      json: true,
      headers: {
        Authorization: this.authHeader
      }
    };
    return rp(options);
  }

  streams() {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.streamsApi,
      json: true,
      headers: {
        Authorization: this.authHeader
      }
    };
    return rp(options);
  }
}