import * as urlParser from 'url';
import * as rp from 'request-promise';
import * as Bluebird from 'bluebird';
export class UrlUtils {
  static isValid(url: string) {
    const result = urlParser.parse(url);
    return (result.protocol === "http:" || result.protocol === "https:") && result.hostname != null;
  }

  static isAccessible(url: string): Bluebird<boolean | string> {
    const errorMsg = "Invalid Graylog Url";
    if(!UrlUtils.isValid(url)) {
      return Bluebird.resolve(errorMsg);
    }
    const options: rp.Options = {
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