import * as rp from 'request-promise';

export class GraylogApi {
  private readonly searchRelativeApi = "search/universal/relative";
  private readonly systemApi = "system";
  private readonly streamsApi = "streams";
  private readonly basicAuthToken: string;
  constructor(private graylogUrlApi: string, private username: string, private password: string) {
    this.basicAuthToken = "Basic " + Buffer.from(this.username + ":" + this.password).toString('base64');
  }
  searchRelative(query: string, range: number, limit?: number, offset?: number, filter?: string, fields?: string, sort?: string) {
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
        Authorization: this.basicAuthToken
      }
    };
    return rp(options);
  }

  system() {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.systemApi,
      json: true,
      headers: {
        Authorization: this.basicAuthToken
      }
    };
    return rp(options);
  }

  streams() {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.streamsApi,
      json: true,
      headers: {
        Authorization: this.basicAuthToken
      }
    };
    return rp(options);
  }
}