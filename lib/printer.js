const chalk = require('chalk');
const htmlToText = require('html-to-text');

const stateFormatter = {
  'In Progress': chalk.yellow,
  Completed: chalk.green,
  Done: chalk.green,
  default: chalk.dim,
};

function formatHtmlText(html) {
  const fixedHtml = html.replace(/<div>/gm, '<p>').replace(/<\/div>/gm, '</p>');

  return htmlToText.fromString(fixedHtml, {
    wordwrap: 120,
  });
}

function printTasks(tasks, { showDescription }) {
  tasks
    .map(({ id, title, description, url, state, assignees }) => ({
      id: chalk.red.bold(id),
      title,
      description: description && showDescription && formatHtmlText(description),
      url: chalk.blue(url),
      state: (stateFormatter[state] || stateFormatter.default)(state),
      assignees: assignees.map(a => chalk.dim(a)).join(', '),
    }))
    .forEach(({ id, title, description, url, state, assignees }) => {
      console.log(`${id} ${url} ${state} ${assignees}\n${title}`);

      if (description && showDescription) {
        console.log(description);
      }

      console.log();
    });
}

module.exports = {
  printTasks,
};
