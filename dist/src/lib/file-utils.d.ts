import { UserConfig } from '../models/user-config';
export declare class FileUtils {
    static exists(path: string): boolean;
    static writeConfigFile(path: string, configs: UserConfig[]): void;
    static readConfigFile(path: string): UserConfig[];
    static createConfigDir(path: string): void;
}
