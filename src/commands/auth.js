// src/commands/auth.js

import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { login, logout } from '../lib/auth.js';
import config from '../lib/config.js';


/**
 * Creates the command for managing authentication.
 * This command includes subcommands for login, logout, and status.
 */
export default function createAuthCommand() {
  const auth = new Command('auth')
    .description('Manage Bullhorn authentication (login, logout, status)');

  // Subcommand: auth login
  auth
    .command('login')
    .description('Authenticate with the Bullhorn API and save the session.')
    .action(async () => {
      const questions = [
        {
          type: 'input',
          name: 'username',
          default: process.env.BH_USER_NAME || 'BH_USER_NAME_NOT_SET',
          message: 'Enter your Bullhorn username:',
        },
        {
          type: 'password',
          name: 'password',
          default: process.env.BH_USER_PASSWORD || 'BH_USER_PASSWORD_NOT_SET',
          message: 'Enter your Bullhorn password:',
          mask: '*',
        },
        {
          type: 'input',
          name: 'clientId',
          default: process.env.BH_API_CLIENT_ID || 'jgjgjgjg-fd-dfasfdsafsa',
          message: 'Enter your Bullhorn API Client ID:',
        },
        {
          type: 'password',
          name: 'clientSecret',
          default: process.env.BH_API_CLIENT_SECRET || 'KDFGJKLAJSALDF9jf4r8',
          message: 'Enter your Bullhorn API Client Secret:',
          mask: '*',
        },
      ];
      
      const credentials = await inquirer.prompt(questions);
      await login(credentials);
    });

  // Subcommand: auth logout
  auth
    .command('logout')
    .description('Clear stored credentials and end the current session.')
    .action(() => {
      logout();
    });

  // Subcommand: auth status
  auth
    .command('status')
    .description('Check the current authentication status.')
    .action(() => {
      const token = config.get('BhRestToken');
      const restUrl = config.get('restUrl');

      if (token && restUrl) {
        console.log(chalk.green('✅ You are logged in.'));
        console.log(chalk.blue(`   REST URL: ${restUrl}`));
      } else {
        console.log(chalk.yellow('❌ You are not logged in.'));
        console.log(`   Run ${chalk.cyan('bh auth login')} to authenticate.`);
      }
    });

  return auth;
}
