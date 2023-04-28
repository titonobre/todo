const { homedir } = require('node:os');
const { writeFile } = require('node:fs/promises');
const path = require('node:path');
const util = require('node:util');

const ini = require('ini');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { mkdirp } = require('mkdirp');

const package = require('../package.json');

const { getCurrentUser } = require('./user');

async function promptTpParams(currentUrl, currentToken) {
  return inquirer.prompt([
    {
      name: 'url',
      type: 'string',
      message: 'Base URL',
      default: currentUrl,
    },
    {
      name: 'token',
      type: 'string',
      message: 'Token',
      default: currentToken,
    },
  ]);
}

async function promptTpTeam(teams) {
  return inquirer.prompt([
    {
      name: 'team',
      type: 'list',
      message: `Team`,
      choices: teams.map(team => ({ name: team.name, value: team.id })),
    },
  ]);
}

async function promptDefaultCommand() {
  return inquirer.prompt([
    {
      name: 'defaultCommand',
      type: 'list',
      message: `Default Command`,
      choices: [
        { name: '(now) show my tasks in progress', value: 'now' },
        { name: '(next) show unassigned tasks', value: 'next' },
        { name: '(team) show all tasks for my team', value: 'team' },
      ],
    },
  ]);
}

async function promptConfigFilePath(home, name, currentPath) {
  if (currentPath) {
    const { confirm } = await inquirer.prompt([
      {
        name: 'confirm',
        type: 'confirm',
        message: `Overwrite file ${currentPath}`,
      },
    ]);

    return { path: confirm ? currentPath : null };
  }

  return inquirer.prompt([
    {
      name: 'path',
      type: 'list',
      message: `Choose config file location`,
      choices: [
        path.join(home, `.${name}rc`),
        path.join(home, `.${name}`, `config`),
        path.join(home, `.config`, name),
        path.join(home, `.config`, name, `config`),
      ],
    },
  ]);
}

async function generateConfig({ _, config, configs, ...currentConfig }) {
  console.log(chalk.underline('TargetProcess'));
  const { url, token } = await promptTpParams(currentConfig.targetProcess.url, currentConfig.targetProcess.token);

  console.log(chalk.underline('Filter'));

  const user = await getCurrentUser(url, token);

  const { team } = await promptTpTeam(user.teams);

  console.log(chalk.underline('CLI'));
  const { defaultCommand } = await promptDefaultCommand();

  const newConfig = {
    ...currentConfig,
    targetProcess: {
      ...currentConfig.targetProcess,
      url,
      token,
    },
    filter: {
      ...currentConfig.filter,
      user: user.id,
      team: team,
    },
    cli: {
      ...currentConfig.cli,
      defaultCommand,
    },
  };

  const iniConfiguration = `; config for ${package.name}\n${ini.stringify(newConfig)}`;

  console.log(chalk.underline('Config File'));
  console.log(chalk.dim(iniConfiguration));

  const { path: configPath } = await promptConfigFilePath(homedir(), 'todo', config);

  if (configPath) {
    try {
      await mkdirp(path.dirname(configPath));

      await writeFile(configPath, iniConfiguration);

      console.log(`Configuration file saved to ${configPath}`);
    } catch (error) {
      throw new Error(`Error saving configuration, ${error}`);
    }
  }
}

module.exports = {
  generateConfig,
};
