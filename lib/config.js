const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const ini = require('ini');
const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');

const package = require('../package.json');

const writeFileP = util.promisify(fs.writeFile);
const mkdirpP = util.promisify(mkdirp);

const homedir = os.homedir();

async function getCurrentUser(tpUrl, tpToken) {
  try {
    const endpoint = `${tpUrl}/api/v1`;

    const response = await axios.get(`${endpoint}/users/LoggedUser`, {
      params: {
        access_token: tpToken,
        format: 'json',
        include: '[Email,TeamMembers[Team]]',
      },
    });

    const loggedUser = response.data;
    const teamMemberships = loggedUser['TeamMembers']['Items'];

    return {
      id: loggedUser['Id'],
      email: loggedUser['Email'],
      teams: teamMemberships.map(membership => ({
        id: membership['Team']['Id'],
        name: membership['Team']['Name'],
      })),
    };
  } catch (error) {
    throw new Error(`Error fetching Current User, ${error}`);
  }
}

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

  console.log(chalk.underline('CLI'));
  const { defaultCommand } = await promptDefaultCommand();

  console.log(chalk.underline('Config File'));

  const user = await getCurrentUser(url, token);

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
      team: user.teams[0].id,
    },
    cli: {
      ...currentConfig.cli,
      defaultCommand,
    },
  };

  const iniConfiguration = `; config for ${package.name}\n${ini.stringify(newConfig)}`;

  console.log(chalk.dim(iniConfiguration));

  const { path: configPath } = await promptConfigFilePath(homedir, 'todo', config);

  if (configPath) {
    try {
      await mkdirpP(path.dirname(configPath));

      await writeFileP(configPath, iniConfiguration);

      console.log(`Configuration file saved to ${configPath}`);
    } catch (error) {
      throw new Error(`Error saving configuration, ${error}`);
    }
  }
}

module.exports = {
  generateConfig,
};
