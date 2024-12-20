import { useState, useCallback, useEffect } from 'react';
import { ProxyChecker } from '../utils/proxyChecker';
import { parseProxy } from '../utils/proxyParser';
import { Proxy, ProxyProtocol, ProxyStatus } from '../types';
import { API_BASE_URL } from '../config';

export const useProxyChecking = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [isServerAvailable, setIsServerAvailable] = useState(true);

  // Проверяем доступность сервера при монтировании
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        setIsServerAvailable(response.ok);
      } catch (error) {
        console.error('Proxy checker server is not available:', error);
        setIsServerAvailable(false);
      }
    };

    checkServer();
  }, []);

  const startChecking = useCallback(async (
    proxyStrings: string[],
    urls: string[] = ['https://www.google.com']
  ) => {
    if (!isServerAvailable) {
      console.error('Proxy checker server is not available');
      return;
    }

    // Сначала добавляем все прокси в статусе queue
    const initialProxies = proxyStrings.map(proxyString => {
      const parsed = parseProxy(proxyString);
      return {
        ip: parsed.ip,
        port: parsed.port,
        username: parsed.username,
        password: parsed.password,
        protocols: ['NONE'] as ProxyProtocol[],
        status: 'queue' as ProxyStatus,
        speed: 0
      };
    });

    setProxies(initialProxies);
    setIsChecking(true);
    setCheckedCount(0);

    const checker = new ProxyChecker(urls, 4000, 2); // timeout 4s, 2 retries

    for (let i = 0; i < proxyStrings.length; i++) {
      const proxyString = proxyStrings[i];
      try {
        // Обновляем статус на processing
        setProxies(prev => prev.map((proxy, index) => 
          index === i ? { ...proxy, status: 'processing' } : proxy
        ));

        const result = await checker.checkProxy(proxyString);
        const parsed = parseProxy(proxyString);

        // Обновляем результат проверки
        setProxies(prev => prev.map((proxy, index) => 
          index === i ? {
            ip: parsed.ip,
            port: parsed.port,
            username: parsed.username,
            password: parsed.password,
            protocols: result.workingProtocols.length > 0 
              ? result.workingProtocols 
              : ['NONE'] as unknown as ProxyProtocol[],
            status: result.workingProtocols.length > 0 ? 'working' : 'failed',
            speed: result.averageSpeed
          } : proxy
        ));

        setCheckedCount(prev => prev + 1);
      } catch (error) {
        console.error(`Error checking proxy ${proxyString}:`, error);
        // В случае ошибки помечаем как failed
        setProxies(prev => prev.map((proxy, index) => 
          index === i ? { ...proxy, status: 'failed' } : proxy
        ));
        setCheckedCount(prev => prev + 1);
      }
    }

    setIsChecking(false);
  }, [isServerAvailable]);

  return {
    isChecking,
    checkedCount,
    proxies,
    startChecking,
    isServerAvailable
  };
}; 