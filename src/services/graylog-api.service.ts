import * as rp from 'request-promise';

export class GraylogApi {
  private readonly searchRelativeApi = "search/universal/relative";
  constructor(private graylogUrlApi: string, private username: string, private password: string) {

  }
  searchRelative(query: string, range: number, limit?: number, offset?: number, filter?: string, fields?: string, sort?: string) {
    const options: rp.Options = {
      url: this.graylogUrlApi + this.searchRelativeApi,
      qs: {
        query,
        range,
        // fields: '_id,timestamp,container_name,message,source',
        fields,
        // sort: 'timestamp:asc'
        sort
      },
      json: true,
      headers: {
        Authorization: "Basic " + Buffer.from(this.username + ":" + this.password).toString('base64')
      }
    };
    return rp(options);
  }
}