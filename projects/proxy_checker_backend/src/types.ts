export interface ProxyConfig {
  host: string;
  port: string;
  protocol: string;
  auth?: {
    username: string;
    password: string;
  };
}

export interface CheckRequest {
  proxy: ProxyConfig;
  urls: string[];
  timeout: number;
  retries: number;
} 