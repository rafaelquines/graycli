"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class FileUtils {
    static exists(path) {
        return fs.existsSync(path);
    }
    static writeTokenFile(path, tokens) {
        fs.writeFileSync(path, JSON.stringify(tokens, undefined, 2));
    }
    static writeCacheFile(path, cache) {
        fs.writeFileSync(path, JSON.stringify(cache, undefined, 2));
    }
    static readJsonFile(path) {
        if (FileUtils.exists(path)) {
            const rawdata = fs.readFileSync(path);
            return JSON.parse(rawdata.toString());
        }
        else {
            return null;
        }
    }
    static readCacheFile(path) {
        if (!FileUtils.exists(path)) {
            FileUtils.writeCacheFile(path, {});
        }
        const rawdata = fs.readFileSync(path);
        return JSON.parse(rawdata.toString());
    }
    static readTokenFile(path) {
        if (!FileUtils.exists(path)) {
            FileUtils.writeTokenFile(path, []);
        }
        const rawdata = fs.readFileSync(path);
        return JSON.parse(rawdata.toString());
    }
    static createUserDir(path) {
        if (!FileUtils.exists(path)) {
            fs.mkdirSync(path);
        }
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=file-utils.js.map