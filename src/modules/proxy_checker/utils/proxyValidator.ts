export const validateProxy = async (proxy: string): Promise<number> => {
  try {
    const start = Date.now();
    
    // Здесь должна быть реальная логика проверки прокси
    // Это просто пример
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responseTime = Date.now() - start;
    return responseTime;
  } catch (error) {
    throw new Error('Invalid proxy');
  }
}; 