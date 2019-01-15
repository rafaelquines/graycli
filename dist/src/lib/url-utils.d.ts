import * as Bluebird from 'bluebird';
export declare class UrlUtils {
    static isValid(url: string): boolean;
    static isAccessible(url: string): Bluebird<boolean | string>;
}
