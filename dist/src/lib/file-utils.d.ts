import { UserToken } from '../models/user-token';
import { UserCache } from '../models/user-cache';
export declare class FileUtils {
    static exists(path: string): boolean;
    static writeTokenFile(path: string, tokens: UserToken[]): void;
    static writeCacheFile(path: string, cache: UserCache): void;
    static readJsonFile(path: string): any;
    static readCacheFile(path: string): UserCache;
    static readTokenFile(path: string): UserToken[];
    static createUserDir(path: string): void;
}
