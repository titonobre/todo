const axios = require('axios');

function formatValue(value) {
  if (Array.isArray(value)) {
    return `(${value.map(formatValue)})`;
  } else {
    switch (typeof value) {
      case 'string':
      case 'boolean':
        return `"${value}"`;
      case 'number':
      default:
        return value;
    }
  }
}

/**
 * @see https://dev.targetprocess.com/docs/sorting-and-filters
 */
function buildFilter(...conditions) {
  return conditions
    .filter(condition => !!condition)
    .map(condition => {
      if (Array.isArray(condition)) {
        const length = condition.length;

        const field = condition[0];
        const operator = length === 3 ? condition[1] : 'eq';
        const value = length === 3 ? condition[2] : condition[1];

        return `${field} ${operator} ${formatValue(value)}`;
      }
    })
    .map(condition => `(${condition})`)
    .join(' and ');
}

async function getTasks(tpUrl, tpToken, { inProgress, defined, user, team, currentSprint }) {
  const endpoint = `${tpUrl}/api/v1`;

  const requestParams = {
    access_token: tpToken,
    format: 'json',
  };

  const filterParams = {
    where: buildFilter(
      user && ['AssignedUser.Id', user],
      team && ['Team.Id', team],
      currentSprint && ['TeamIteration.IsCurrent', true],
      defined && ['EntityState.Name', 'in', ['Defined']],
      inProgress && ['EntityState.Name', 'in', ['In Progress']],
    ),
  };

  const includeParams = {
    include: '[Id,Name,Description,AssignedUser,EntityState]',
  };

  const response = await axios.get(`${endpoint}/UserStories`, {
    params: {
      ...requestParams,
      ...filterParams,
      ...includeParams,
    },
  });

  const items = response.data['Items'];

  return items.map(item => {
    const id = item['Id'];
    const title = item['Name'];
    const description = item['Description'];
    const url = `${tpUrl}/entity/${id}`;
    const state = item['EntityState']['Name'];
    const assignees = item['AssignedUser']['Items'].map(user => `${user.FirstName} ${user.LastName}`);

    return { id, title, description, url, state, assignees };
  });
}

module.exports = {
  getTasks,
};
