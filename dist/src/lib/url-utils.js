"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const urlParser = require("url");
const rp = require("request-promise");
const Bluebird = require("bluebird");
class UrlUtils {
    static isValid(url) {
        const result = urlParser.parse(url);
        return (result.protocol === "http:" || result.protocol === "https:") && result.hostname != null;
    }
    static isAccessible(url) {
        const errorMsg = "Invalid Graylog Url";
        if (!UrlUtils.isValid(url)) {
            return Bluebird.resolve(errorMsg);
        }
        const options = {
            url,
            method: 'HEAD'
        };
        return rp(options)
            .then((res) => {
            return Bluebird.resolve(true);
        })
            .catch((err) => {
            return Bluebird.resolve(errorMsg);
        });
    }
}
exports.UrlUtils = UrlUtils;
//# sourceMappingURL=url-utils.js.map