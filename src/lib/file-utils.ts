import * as fs from 'fs';
import { UserToken } from '../models/user-token';
import { UserCache } from '../models/user-cache';

export class FileUtils {

  static exists(path: string) {
    return fs.existsSync(path);
  }

  static writeTokenFile(path: string, tokens: UserToken[]) {
    fs.writeFileSync(path, JSON.stringify(tokens, undefined, 2));
  }

  static writeCacheFile(path: string, cache: UserCache) {
    fs.writeFileSync(path, JSON.stringify(cache, undefined, 2));
  }

  static readJsonFile(path: string) {
    if (FileUtils.exists(path)) {
      const rawdata = fs.readFileSync(path);
      return JSON.parse(rawdata.toString());
    }
    else {
      return null;
    }
  }

  static readCacheFile(path: string) {
    if (!FileUtils.exists(path)) {
      FileUtils.writeCacheFile(path, {});
    }
    const rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata.toString()) as UserCache;
  }

  static readTokenFile(path: string) {
    if (!FileUtils.exists(path)) {
      FileUtils.writeTokenFile(path, []);
    }
    const rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata.toString()) as UserToken[];
  }

  static createUserDir(path: string) {
    if (!FileUtils.exists(path)) {
      fs.mkdirSync(path);
    }
  }
}