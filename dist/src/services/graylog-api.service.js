"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
const sprintf_js_1 = require("sprintf-js");
class GraylogApi {
    constructor(graylogUrl, authHeader) {
        this.authHeader = authHeader;
        this.searchRelativeApi = "/search/universal/relative";
        this.systemApi = "/system";
        this.streamsApi = "/streams";
        this.userInfoApi = "/users/%(username)s";
        this.listTokensApi = "/users/%(username)s/tokens";
        this.createTokenApi = "/users/%(username)s/tokens/%(name)s";
        this.graylogUrlApi = graylogUrl + (graylogUrl.endsWith("/") ? "" : "/") + "api";
    }
    listTokens(username) {
        const options = {
            url: this.graylogUrlApi + sprintf_js_1.sprintf(this.listTokensApi, { username }),
            json: true,
            headers: {
                Authorization: this.authHeader
            }
        };
        return rp(options);
    }
    createToken(username, tokenName) {
        const options = {
            method: 'POST',
            url: this.graylogUrlApi + sprintf_js_1.sprintf(this.createTokenApi, { username, name: tokenName }),
            json: true,
            headers: {
                Authorization: this.authHeader,
                "X-Requested-By": "graycli"
            }
        };
        return rp(options);
    }
    searchRelative(query, range, limit, offset, filter, fields, sort, debug = false) {
        const options = {
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
        const options = {
            url: this.graylogUrlApi + this.systemApi,
            json: true,
            headers: {
                Authorization: this.authHeader
            }
        };
        return rp(options);
    }
    permissionsCan(username, permission) {
        return this.userInfo(username)
            .then((user) => {
            const permissions = user.permissions;
            return permissions.some((x) => x.startsWith(permission) || x === '*');
        });
    }
    streams() {
        const options = {
            url: this.graylogUrlApi + this.streamsApi,
            json: true,
            headers: {
                Authorization: this.authHeader
            }
        };
        return rp(options);
    }
    userInfo(username) {
        const options = {
            url: this.graylogUrlApi + sprintf_js_1.sprintf(this.userInfoApi, { username }),
            json: true,
            headers: {
                Authorization: this.authHeader
            }
        };
        return rp(options);
    }
}
exports.GraylogApi = GraylogApi;
//# sourceMappingURL=graylog-api.service.js.map