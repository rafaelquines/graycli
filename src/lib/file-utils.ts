import * as fs from 'fs';
import { UserConfig } from '../models/user-config';

export class FileUtils {

  static exists(path: string) {
    return fs.existsSync(path);
  }

  static writeConfigFile(path: string, configs: UserConfig[]) {
    fs.writeFileSync(path, JSON.stringify(configs, undefined, 2));
  }

  static readConfigFile(path: string) {
    if (!FileUtils.exists(path)) {
      FileUtils.writeConfigFile(path, []);
    }
    const rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata.toString()) as UserConfig[];
  }

  static createConfigDir(path: string) {
    if (!FileUtils.exists(path)) {
      fs.mkdirSync(path);
    }
  }
}