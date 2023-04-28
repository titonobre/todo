import { debuglog } from 'node:util';

import chalk from 'chalk';
import { htmlToText } from 'html-to-text';

const log = debuglog('todo');

const stateFormatter = {
  'In Progress': chalk.yellow,
  Development: chalk.yellow,
  'Merge Request': chalk.yellow,
  QA: chalk.yellow,
  Completed: chalk.green,
  Done: chalk.green,
  default: chalk.dim,
};

function formatHtmlText(html) {
  const fixedHtml = html.replace(/<div>/gm, '<p>').replace(/<\/div>/gm, '</p>');

  return htmlToText(fixedHtml, {
    wordwrap: 120,
  }).replace(/\n\s*\n\s*\n/g, '\n\n');
}

function formatProgress({ step, steps }) {
  return `${chalk.bold('■'.repeat(step))}${chalk.dim('■'.repeat(steps - step))}`;
}

function formatState(state) {
  return (stateFormatter[state] || stateFormatter.default)(state);
}

function formatComposedState({ state, teamState }) {
  if (!teamState || teamState === state) return formatState(state);
  else return `${formatState(state)} > ${formatState(teamState)}`;
}

function formatAssignees(assignees) {
  return assignees.map(assignee => chalk.dim(assignee)).join(', ');
  return assignees.map(assignee => dim(assignee)).join(', ');
}

export function printTasks(tasks, { showDescription }) {
  log(tasks);

  tasks
    .map(({ id, title, description, url, assignees, progress }) => ({
      id: chalk.red.bold(id),
      title,
      description: description && showDescription && formatHtmlText(description),
      url: chalk.blue(url),
      state: formatComposedState(progress),
      assignees: formatAssignees(assignees),
      progress: formatProgress(progress),
    }))
    .forEach(({ id, title, description, url, state, assignees, progress }) => {
      console.log(`${id} ${url} ${progress} ${state} ${assignees}\n${title}`);

      if (description && showDescription) {
        console.log(description);
      }

      console.log();
    });
}
