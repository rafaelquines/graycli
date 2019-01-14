"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
class GraylogApi {
    constructor(graylogUrlApi, username, password) {
        this.graylogUrlApi = graylogUrlApi;
        this.username = username;
        this.password = password;
        this.searchRelativeApi = "search/universal/relative";
        this.systemApi = "system";
        this.basicAuthToken = "Basic " + Buffer.from(this.username + ":" + this.password).toString('base64');
    }
    searchRelative(query, range, limit, offset, filter, fields, sort) {
        const options = {
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
                Authorization: this.basicAuthToken
            }
        };
        return rp(options);
    }
    system() {
        const options = {
            url: this.graylogUrlApi + this.systemApi,
            json: true,
            headers: {
                Authorization: this.basicAuthToken
            }
        };
        return rp(options);
    }
}
exports.GraylogApi = GraylogApi;
//# sourceMappingURL=graylog-api.service.js.map