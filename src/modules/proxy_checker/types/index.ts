export type ProxyProtocol = 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5' | 'NONE';
export type ProxyStatus = 'queue' | 'processing' | 'working' | 'failed';

export interface Proxy {
  ip: string;
  port: string;
  protocols: ProxyProtocol[];
  status: ProxyStatus;
  speed: number;
  username?: string;
  password?: string;
}

export interface ProxyFilters {
  protocols: ProxyProtocol[];
  onlyWorking: boolean;
  maxSpeed: number;
}

export type ProxyFormat = 
  | 'ip:port'
  | 'protocol://ip:port'
  | 'user:pass@ip:port'
  | 'protocol://user:pass@ip:port'
  | 'user:pass:ip:port'
  | 'ip:port:user:pass'
  | 'ip:port@user:pass'
  | 'protocol://user:pass:ip:port'
  | 'protocol://ip:port:user:pass'
  | 'protocol://ip:port@user:pass';

export interface ProxyCheckerStatus {
  isRunning: boolean;
  checked: number;
  total: number;
  valid: number;
  invalid: number;
} 