const axios = require('axios');

function formatValue(value) {
  if (Array.isArray(value)) {
    return `(${value.map(formatValue).join(',')})`;
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
    include:
      '[Id,Name,Description,EntityState,AssignedUser,ResponsibleTeam[EntityState[Name,NumericPriority,Workflow[Id]]]]',
  };

  const sortingParams = {
    orderBy: 'NumericPriority',
  };

  const response = await axios.get(`${endpoint}/Assignables`, {
    params: {
      ...requestParams,
      ...filterParams,
      ...includeParams,
      ...sortingParams,
    },
  });

  const items = response.data['Items'];

  const tasks = items.map(item => {
    const id = item['Id'];
    const title = item['Name'];
    const description = item['Description'];
    const url = `${tpUrl}/entity/${id}`;
    const state = item['EntityState']['Name'];
    const teamState = item['ResponsibleTeam']['EntityState']['Name'];
    const teamWorkflow = item['ResponsibleTeam']['EntityState']['Workflow']['Id'];
    const progress = {
      step: item['ResponsibleTeam']['EntityState']['NumericPriority'],
    };
    const assignees = item['AssignedUser']['Items'].map(user => `${user.FirstName} ${user.LastName}`);

    return { id, title, description, url, state, teamState, teamWorkflow, progress, assignees };
  });

  const workflowIds = tasks.reduce((workflows, task) => workflows.add(task.teamWorkflow), new Set());

  const workflows = await getWorkflows(tpUrl, tpToken, { workflowIds: [...workflowIds] });

  const workflowsMap = workflows.reduce((map, workflow) => {
    return {
      ...map,
      [workflow.id]: workflow,
    };
  }, {});

  return tasks.map(task => {
    const workflow = workflowsMap[task.teamWorkflow];

    return {
      ...task,
      progress: {
        ...task.progress,
        steps: workflow.statesCount,
      },
    };
  });
}

async function getWorkflows(tpUrl, tpToken, { workflowIds }) {
  if (!workflowIds || workflowIds.length === 0) {
    return [];
  }

  const endpoint = `${tpUrl}/api/v1`;

  const requestParams = {
    access_token: tpToken,
    format: 'json',
  };

  const filterParams = {
    where: buildFilter(workflowIds && ['Id', 'in', workflowIds]),
  };

  const appendParams = {
    append: '[EntityStates-Count]',
  };

  const response = await axios.get(`${endpoint}/Workflows`, {
    params: {
      ...requestParams,
      ...filterParams,
      ...appendParams,
    },
  });

  const items = response.data['Items'];

  return items.map(item => {
    const id = item['Id'];
    const statesCount = item['EntityStates-Count'];

    return { id, statesCount };
  });
}

module.exports = {
  getTasks,
};
