import { ProxyProtocol } from '../types';

interface ParsedProxy {
  ip: string;
  port: string;
  username?: string;
  password?: string;
  protocol?: ProxyProtocol;
}

export const parseProxy = (proxyString: string): ParsedProxy => {
  let protocol: ProxyProtocol | undefined;
  let auth: string | undefined;
  let ipPort: string;

  // Проверяем наличие протокола
  if (proxyString.includes('://')) {
    const [protocolPart, rest] = proxyString.split('://');
    protocol = protocolPart.toUpperCase() as ProxyProtocol;
    proxyString = rest;
  }

  // Проверяем различные форматы auth
  if (proxyString.includes('@')) {
    [auth, ipPort] = proxyString.split('@');
  } else if (proxyString.includes(':') && proxyString.split(':').length > 2) {
    const parts = proxyString.split(':');
    if (parts.length === 4) {
      auth = `${parts[0]}:${parts[1]}`;
      ipPort = `${parts[2]}:${parts[3]}`;
    } else {
      ipPort = proxyString;
    }
  } else {
    ipPort = proxyString;
  }

  const [ip, port] = ipPort.split(':');
  const [username, password] = auth ? auth.split(':') : [];

  return {
    ip,
    port,
    ...(username && { username, password }),
    ...(protocol && { protocol })
  };
}; 