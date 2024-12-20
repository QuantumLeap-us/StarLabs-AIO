import express from 'express';
import cors from 'cors';
import { checkProxy } from './proxyChecker';
import { CheckRequest, ProxyConfig } from './types';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Хранилище результатов проверки
const checkResults = new Map<string, boolean>();

app.post('/api/check-proxy', async (req, res) => {
  try {
    const { proxy, urls, timeout = 4000, retries = 2 }: CheckRequest = req.body;
    // Кодируем ключ в base64 чтобы избежать проблем с URL
    const proxyKey = Buffer.from(`${proxy.protocol}://${proxy.host}:${proxy.port}`).toString('base64');

    console.log('Starting proxy check:', { proxy, urls });

    // Сразу отправляем ответ, что начали проверку
    res.json({ 
      success: true,
      message: 'Check started',
      proxyKey
    });

    // Запускаем проверку асинхронно
    checkProxyAsync(proxy, urls, timeout, retries, proxyKey);
  } catch (error) {
    console.error('Error in proxy check endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Эндпоинт для получения результата проверки
app.get('/api/check-result/:proxyKey', (req, res) => {
  const { proxyKey } = req.params;
  const result = checkResults.get(proxyKey);

  if (result === undefined) {
    res.json({ status: 'checking' });
  } else {
    res.json({ 
      status: 'completed',
      success: result
    });
    // Очищаем результат после получения
    checkResults.delete(proxyKey);
  }
});

async function checkProxyAsync(
  proxy: ProxyConfig, 
  urls: string[], 
  timeout: number, 
  retries: number,
  proxyKey: string
) {
  try {
    for (const url of urls) {
      console.log(`\nTrying URL: ${url}`);
      
      for (let attempt = 0; attempt < retries; attempt++) {
        console.log(`Attempt ${attempt + 1}/${retries}`);
        
        const isWorking = await checkProxy(proxy, url, timeout);
        
        if (isWorking) {
          checkResults.set(proxyKey, true);
          return;
        }

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    checkResults.set(proxyKey, false);
  } catch (error) {
    console.error('Error checking proxy:', error);
    checkResults.set(proxyKey, false);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 4004;

app.listen(PORT, () => {
  console.log(`Proxy checker server running on port ${PORT}`);
}); 