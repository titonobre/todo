#!/usr/bin/env node

const rc = require('rc');
const program = require('commander');

const { getTasks } = require('./lib/todo');
const { generateConfig } = require('./lib/config');
const { printTasks } = require('./lib/printer');

const defaultConfig = {
  targetProcess: {
    url: undefined,
    token: undefined,
  },
  filter: {
    user: undefined,
    team: undefined,
  },
  cli: {
    defaultCommand: 'now',
  },
};

const config = rc('todo', defaultConfig);

// current tasks
program
  .command('now')
  .description('show my tasks in progress')
  .option('-d, --show-description', 'Show Description', false)
  .action(async function({ showDescription }) {
    const tasks = await getTasks(config.targetProcess.url, config.targetProcess.token, {
      user: config.filter.user,
      inProgress: true,
    });

    printTasks(tasks, { showDescription });
  });

// next tasks
program
  .command('next')
  .alias('n')
  .description('show unassigned tasks')
  .option('-d, --show-description', 'Show Description', false)
  .action(async function({ showDescription }) {
    const tasks = await getTasks(config.targetProcess.url, config.targetProcess.token, {
      team: config.filter.team,
      currentSprint: true,
      defined: true,
    });

    printTasks(tasks, { showDescription });
  });

// tasks for the team
program
  .command('team')
  .alias('t')
  .description('show all tasks for my team')
  .option('-d, --show-description', 'Show Description', false)
  .action(async function({ showDescription }) {
    const tasks = await getTasks(config.targetProcess.url, config.targetProcess.token, {
      team: config.filter.team,
      currentSprint: true,
    });

    printTasks(tasks, { showDescription });
  });

// config
program
  .command('config')
  .description('update the configuration')
  .action(async () => {
    try {
      await generateConfig(config);
    } catch (error) {
      console.error(error);
    }
  });

// fallback to config wizards
if (!config || !config.targetProcess || !config.targetProcess.url || !config.targetProcess.token) {
  console.warn('The configuration is missing or incomplete. Please answer the following questions...');

  process.argv.splice(2, 0, 'config');
}

// kinda hackish default command
const [, , arg3] = process.argv;
if (!arg3 || (arg3.startsWith('-') && arg3 != '-h')) {
  process.argv.splice(2, 0, config.cli.defaultCommand);
}

program.parse(process.argv);
