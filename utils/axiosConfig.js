const axios = require('axios');

const axiosInstance = axios.create({
  timeout: 5 * 60 * 1000, // 5 minutes timeout
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Add retry mechanism
axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  
  config.retryCount = config.retryCount || 0;
  
  if (config.retryCount >= config.retry) {
    return Promise.reject(err);
  }
  
  config.retryCount += 1;
  
  const backoff = new Promise((resolve) => {
    setTimeout(() => resolve(), config.retryDelay || 1000);
  });
  
  await backoff;
  return axiosInstance(config);
});

module.exports = axiosInstance;