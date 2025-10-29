// src/lib/auth.js

import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import config from './config.js';


export async function login({ username, password, clientId, clientSecret }) {
  const spinner = ora('Authenticating with Bullhorn...').start();

  try {
    spinner.text = 'Step 1 of 4: Determining data center...';
    const loginInfoUrl = `https://rest.bullhornstaffing.com/rest-services/loginInfo?username=${username}`;
    const loginInfoResponse = await axios.get(loginInfoUrl);
    const loginData = loginInfoResponse.data;

    const authorizeUrl = `${loginData.oauthUrl}/authorize`;
    const tokenUrl = `${loginData.oauthUrl}/token`;
    const apiLoginUrl = loginData.restUrl; // This is the base for the final login call

    if (!loginData.oauthUrl || !loginData.restUrl) {
      throw new Error('Failed to construct necessary auth URLs from loginInfo response. Missing oauthUrl or restUrl.');
    }

    // --- Step 2: Get an Authorization Code ---
    spinner.text = 'Step 2 of 4: Obtaining authorization code...';
    const authCodeParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      action: 'Login',
      username,
      password,
    });
    
    let authorizationCode;
    try {
      await axios.get(`${authorizeUrl}?${authCodeParams.toString()}`, {
        maxRedirects: 0 // Prevent axios from following the redirect
      });
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const location = error.response.headers.location;
        const urlParams = new URLSearchParams(new URL(location).search);
        authorizationCode = urlParams.get('code');
      } else {
        throw error;
      }
    }

    if (!authorizationCode) {
      throw new Error('Failed to obtain an authorization code. Please check your username and password.');
    }
    
    // --- Step 3: Exchange Authorization Code for an Access Token ---
    spinner.text = 'Step 3 of 4: Exchanging code for access token...';
    const accessTokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenResponse = await axios.post(tokenUrl, accessTokenParams);
    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Failed to obtain an access token. Please check your API keys.');
    }

    // --- Step 4: Log in to the REST API with the Access Token ---
    spinner.text = 'Step 4 of 4: Finalizing API session...';
    const finalLoginUrl = `${apiLoginUrl}/login?version=*&access_token=${access_token}`;
    const finalLoginResponse = await axios.post(finalLoginUrl);

    const { BhRestToken, restUrl } = finalLoginResponse.data;

    if (!BhRestToken || !restUrl) {
      throw new Error('Invalid response from Bullhorn. Missing final BhRestToken or restUrl.');
    }

    // --- Success: Store the essential session data ---
    config.set('BhRestToken', BhRestToken);
    config.set('refreshToken', refresh_token);
    config.set('restUrl', restUrl);
    config.set('tokenUrl', tokenUrl);
    config.set('clientId', clientId);
    config.set('clientSecret', clientSecret);
    
    spinner.succeed(chalk.green('Successfully authenticated!'));
    console.log(chalk.blue(`Your API session is now active.`));

  } catch (error) {
    spinner.fail(chalk.red('Authentication failed.'));
    
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.errorMessage || error.response.data?.error_description || 'No description provided.';
      console.error(chalk.red(`Error ${status}: ${errorMsg}`));
      console.error(chalk.yellow('Please check your credentials and API keys.'));
    } else {
      console.error(chalk.red('An unexpected error occurred:', error.message));
    }

    process.exit(1);
  }
}

/**
 * Clears the stored user session data.
 */
export function logout() {
  const spinner = ora('Logging out...').start();
  config.clear();
  spinner.succeed(chalk.green('Successfully logged out.'));
  console.log(chalk.blue('All stored credentials and session data have been removed.'));
}

export async function handleTokenRefresh() {
  const spinner = ora('Session expired. Refreshing token...').start();
  
  const refreshToken = config.get('refreshToken');
  const tokenUrl = config.get('tokenUrl');
  const clientId = config.get('clientId');
  const clientSecret = config.get('clientSecret');

  if (!refreshToken || !tokenUrl || !clientId || !clientSecret) {
    spinner.fail(chalk.red('Cannot refresh session.'));
    console.error(chalk.yellow('Refresh data is missing. Please run `bh auth login` again.'));
    process.exit(1);
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await axios.post(tokenUrl, params);
    const { access_token, refresh_token: newRefreshToken } = response.data;

    // Log in to the REST API again with the new access_token to get a new BhRestToken
    const apiLoginUrl = config.get('restUrl').replace(/\/v\d+\.\d+$/, ''); // Get base URL
    const finalLoginUrl = `${apiLoginUrl}/login?version=*&access_token=${access_token}`;
    const finalLoginResponse = await axios.post(finalLoginUrl);
    const { BhRestToken } = finalLoginResponse.data;

    if (!BhRestToken) {
        throw new Error('Failed to get new BhRestToken after refresh.');
    }

    // Save the new tokens
    config.set('BhRestToken', BhRestToken);
    config.set('refreshToken', newRefreshToken); // Bullhorn often sends a new refresh token

    spinner.succeed(chalk.green('Session renewed.'));
    return BhRestToken; // Return the new token to the interceptor

  } catch (error) {
    spinner.fail(chalk.red('Session refresh failed.'));
    console.error(chalk.yellow('Your session has likely expired completely.'));
    console.error(chalk.yellow('Please run `bh auth login` to start a new session.'));
    logout(); // Clear the invalid credentials
    process.exit(1);
  }
}