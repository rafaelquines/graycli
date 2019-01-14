"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class FileUtils {
    static exists(path) {
        return fs.existsSync(path);
    }
    static writeConfigFile(path, configs) {
        fs.writeFileSync(path, JSON.stringify(configs, undefined, 2));
    }
    static readConfigFile(path) {
        if (!FileUtils.exists(path)) {
            FileUtils.writeConfigFile(path, []);
        }
        const rawdata = fs.readFileSync(path);
        return JSON.parse(rawdata.toString());
    }
    static createConfigDir(path) {
        if (!FileUtils.exists(path)) {
            fs.mkdirSync(path);
        }
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=file-utils.js.map