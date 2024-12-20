import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyConfig } from './types';

export async function checkProxy(
  proxy: ProxyConfig,
  url: string,
  timeout: number
): Promise<boolean> {
  const proxyUrl = proxy.auth
    ? `${proxy.protocol}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
    : `${proxy.protocol}://${proxy.host}:${proxy.port}`;

  console.log('\ncheckProxy function:', {
    protocol: proxy.protocol,
    host: proxy.host,
    port: proxy.port,
    hasAuth: !!proxy.auth,
    url,
    timeout
  });

  try {
    console.log('Creating proxy agent...');
    const agent = proxy.protocol.startsWith('socks')
      ? new SocksProxyAgent(proxyUrl)
      : new HttpsProxyAgent(proxyUrl);
    
    console.log('Creating axios instance...');
    const client = axios.create({
      httpsAgent: agent,
      httpAgent: agent,
      timeout,
      validateStatus: null,
      proxy: false
    });

    console.log('Sending request...');
    const response = await client.get(url);
    console.log('Got response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error in checkProxy:', {
        message: error.message,
        code: error.code,
        timeout: error.code === 'ECONNABORTED',
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText
        }
      });
    } else {
      console.error('Unknown error in checkProxy:', error);
    }
    return false;
  }
} 