export interface UserConfig {
  apiHost: string;
  apiPort: number;
  apiPath: string;
  apiProtocol: string;
  username: string;
  password: string;
  interval: number;
  filter?: string;
  name: string;
  range: number;
}