// src/commands/service/events.js — Manage Bullhorn REST API event subscriptions
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../../lib/api.js';
import inquirer from 'inquirer';

export default function buildEventsCommand() {
  const cmd = new Command('events')
    .description('Manage Bullhorn REST API event subscriptions (create, list, consume, delete).');

  // Create subscription
  cmd.command('subscribe <subscriptionId>')
    .description('Create an event subscription via PUT /event/subscription/{subscriptionId}.')
    .option('-e, --entities <entities>', 'Comma-separated entity names (e.g. Candidate,Placement,JobOrder)')
    .option('-t, --event-types <types>', 'Comma-separated event types: INSERTED,UPDATED,DELETED (default: INSERTED,UPDATED,DELETED)', 'INSERTED,UPDATED,DELETED')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      const entities = options.entities || 'Candidate,ClientContact,Placement,JobOrder,Note,Task';
      const eventTypes = options.eventTypes;

      const spinner = ora(`Creating event subscription ${subscriptionId} for entities [${entities}]...`).start();
      try {
        const response = await api.put(`/event/subscription/${subscriptionId}`, null, {
          params: {
            type: 'entity',
            names: entities,
            eventTypes,
          },
        });
        spinner.succeed(chalk.green(`Event subscription ${subscriptionId} created!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nEvent Subscription Created:\n`));
          console.log(`  Subscription ID: ${response.data?.subscriptionId || subscriptionId}`);
          console.log(`  Entities: ${entities}`);
          console.log(`  Event Types: ${eventTypes}`);
          console.log(`  Created: ${response.data?.createdOn ? new Date(response.data.createdOn).toISOString() : 'N/A'}`);
          if (response.data?.jmsSelector) {
            console.log(`  JMSToken: ${response.data.jmsSelector}`);
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create event subscription.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // List subscriptions
  cmd.command('list')
    .description('List all event subscriptions via GET /event/subscription.')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (options) => {
      const spinner = ora('Fetching event subscriptions...').start();
      try {
        const response = await api.get('/event/subscription');
        const subscriptions = response.data?.data || response.data || [];
        spinner.succeed(chalk.green(`Fetched ${Array.isArray(subscriptions) ? subscriptions.length : 0} subscription(s).`));
        if (options.output === 'json') {
          console.log(JSON.stringify(subscriptions, null, 2));
        } else {
          if (Array.isArray(subscriptions) && subscriptions.length === 0) {
            console.log(chalk.yellow('No event subscriptions found.'));
            return;
          }
          const table = new Table({
            head: [
              chalk.cyan.bold('Subscription ID'),
              chalk.cyan.bold('Entities'),
              chalk.cyan.bold('Event Types'),
              chalk.cyan.bold('Created'),
            ],
          });
          for (const sub of (Array.isArray(subscriptions) ? subscriptions : [subscriptions])) {
            table.push([
              sub.subscriptionId || '-',
              sub.names || '-',
              sub.eventTypes || '-',
              sub.createdOn ? new Date(sub.createdOn).toISOString() : '-',
            ]);
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to list event subscriptions.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // Consume events
  cmd.command('consume <subscriptionId>')
    .description('Consume events from a subscription via GET /event/subscription/{subscriptionId}.')
    .option('-m, --max-events <max>', 'Maximum events to retrieve (default: 100)', parseInt, 100)
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      const maxEvents = options.maxEvents;
      const spinner = ora(`Consuming up to ${maxEvents} events from subscription ${subscriptionId}...`).start();
      try {
        const response = await api.get(`/event/subscription/${subscriptionId}`, {
          params: { maxEvents },
        });
        const events = response.data?.data || response.data || [];
        spinner.succeed(chalk.green(`Consumed ${Array.isArray(events) ? events.length : 0} event(s).`));
        if (options.output === 'json') {
          console.log(JSON.stringify(events, null, 2));
        } else {
          if (Array.isArray(events) && events.length === 0) {
            console.log(chalk.yellow('No events to consume.'));
            return;
          }
          const table = new Table({
            head: [
              chalk.cyan.bold('#'),
              chalk.cyan.bold('Entity'),
              chalk.cyan.bold('Event ID'),
              chalk.cyan.bold('Type'),
              chalk.cyan.bold('Entity ID'),
              chalk.cyan.bold('Updated Fields'),
              chalk.cyan.bold('Timestamp'),
            ],
          });
          for (const evt of (Array.isArray(events) ? events : [events])) {
            const updatedFields = evt.updatedProperties
              ? Array.isArray(evt.updatedProperties) ? evt.updatedProperties.join(', ') : String(evt.updatedProperties)
              : '-';
            table.push([
              events.length > 1 ? events.indexOf(evt) + 1 : 1,
              evt.entityName || '-',
              evt.eventId || '-',
              evt.entityEventType || '-',
              evt.entityId ?? '-',
              updatedFields,
              evt.eventTimestamp ? new Date(evt.eventTimestamp).toISOString() : '-',
            ]);
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to consume events.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // Delete subscription
  cmd.command('unsubscribe <subscriptionId>')
    .description('Delete an event subscription via DELETE /event/subscription/{subscriptionId}.')
    .option('-f, --force', 'Skip confirmation prompt')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      if (!options.force) {
        const { confirm } = await inquirer.prompt([{
          name: 'confirm',
          type: 'confirm',
          message: chalk.yellow(`Are you sure you want to delete event subscription ${subscriptionId}?`),
          default: false,
        }]);
        if (!confirm) {
          console.log(chalk.yellow('Aborted.'));
          return;
        }
      }

      const spinner = ora(`Deleting event subscription ${subscriptionId}...`).start();
      try {
        const response = await api.delete(`/event/subscription/${subscriptionId}`);
        spinner.succeed(chalk.green(`Event subscription ${subscriptionId} deleted!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.green(`Event subscription ${subscriptionId} successfully deleted.`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to delete event subscription.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}
