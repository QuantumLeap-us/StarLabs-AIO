import axios from 'axios';
import { ProxyProtocol } from '../types';
import { parseProxy } from './proxyParser';
import { API_BASE_URL } from '../config';

interface CheckResult {
  workingProtocols: ProxyProtocol[];
  averageSpeed: number;
  error?: string;
}

export class ProxyChecker {
  private readonly urls: string[];
  private readonly timeout: number;
  private readonly retries: number;
  private readonly maxConcurrent: number;
  private readonly apiUrl: string = `${API_BASE_URL}/check-proxy`;

  constructor(
    urls: string[] = ['https://www.google.com'],
    timeout: number = 5000,
    retries: number = 3,
    maxConcurrent: number = 10
  ) {
    this.urls = urls;
    this.timeout = timeout;
    this.retries = retries;
    this.maxConcurrent = maxConcurrent;
  }

  private async checkWithProtocol(
    proxyString: string,
    protocol: ProxyProtocol
  ): Promise<number | null> {
    const proxy = parseProxy(proxyString);
    
    try {
      const start = Date.now();
      
      const response = await axios.post(this.apiUrl, {
        proxy: {
          host: proxy.ip,
          port: proxy.port,
          protocol: protocol.toLowerCase(),
          ...(proxy.username && {
            auth: {
              username: proxy.username,
              password: proxy.password
            }
          })
        },
        urls: this.urls,
        timeout: this.timeout,
        retries: this.retries
      });

      if (response.data.success) {
        const proxyKey = response.data.proxyKey;
        let attempts = 0;
        const maxAttempts = 20; // Максимум 10 секунд ожидания (20 * 500ms)
        
        while (attempts < maxAttempts) {
          const resultResponse = await axios.get(`${API_BASE_URL}/check-result/${proxyKey}`);
          
          if (resultResponse.data.status === 'completed') {
            return resultResponse.data.success ? Date.now() - start : null;
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`Timeout waiting for result of ${protocol} check`);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking proxy:', error);
      return null;
    }
  }

  public async checkProxy(proxyString: string): Promise<CheckResult> {
    const proxy = parseProxy(proxyString);
    const workingProtocols: ProxyProtocol[] = [];
    const speeds: number[] = [];

    // Если протокол указан, проверяем только его
    if (proxy.protocol) {
      console.log('Checking specific protocol:', proxy.protocol);
      const speed = await this.checkWithProtocol(proxyString, proxy.protocol);
      if (speed !== null) {
        workingProtocols.push(proxy.protocol);
        speeds.push(speed);
      }
    } else {
      // Проверяем все протоколы
      const protocols: ProxyProtocol[] = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5'];
      console.log('Checking all protocols:', protocols);
      for (const protocol of protocols) {
        const speed = await this.checkWithProtocol(proxyString, protocol);
        console.log(`Protocol ${protocol} check result:`, { speed });
        if (speed !== null) {
          workingProtocols.push(protocol);
          speeds.push(speed);
        }
      }
    }

    const result = {
      workingProtocols,
      averageSpeed: speeds.length > 0 
        ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
        : 0
    };
    console.log('Check result for proxy:', { proxyString, result });
    return result;
  }

  public async checkProxies(proxies: string[]): Promise<Map<string, CheckResult>> {
    const results = new Map<string, CheckResult>();
    const chunks: string[][] = [];

    // Разбиваем на чанки по maxConcurrent
    for (let i = 0; i < proxies.length; i += this.maxConcurrent) {
      chunks.push(proxies.slice(i, i + this.maxConcurrent));
    }

    // Обрабатываем чанки последовательно
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async proxy => {
        const result = await this.checkProxy(proxy);
        results.set(proxy, result);
      });

      await Promise.all(chunkPromises);
    }

    return results;
  }
} 