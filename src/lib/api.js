// src/lib/api.js

import axios from 'axios';
import chalk from 'chalk';
import config from './config.js';
import { handleTokenRefresh } from './auth.js';

let BhRestToken = config.get('BhRestToken');
const restUrl = config.get('restUrl');

if (!BhRestToken || !restUrl) {
  const isAuthCommand = process.argv.includes('auth') || process.argv.includes('entities');
  const isHelpCommand = process.argv.includes('--help');

  if (!isAuthCommand && !isHelpCommand) {
    console.error(chalk.red('Authentication error: You are not logged in.'));
    console.error(`Please run ${chalk.cyan('bh auth login')} to start a session.`);
    process.exit(1);
  }
}

const api = axios.create({
  baseURL: restUrl,
  headers: {
    'BhRestToken': BhRestToken,
  },
});

// --- AXIOS INTERCEPTOR FOR TOKEN REFRESH ---
api.interceptors.response.use(
  (response) => response, // On success, just pass the response through
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request to prevent infinite loops

      try {
        const newBhRestToken = await handleTokenRefresh();
        
        // Update the axios client instance's default headers
        api.defaults.headers.common['BhRestToken'] = newBhRestToken;
        // Update the original request's header
        originalRequest.headers['BhRestToken'] = newBhRestToken;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);


export default api;