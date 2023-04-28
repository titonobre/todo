const axios = require('axios');

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
exports.getCurrentUser = getCurrentUser;
