// src/lib/config.js

import Conf from 'conf';

// Define the structure and validation rules for our configuration data.
// This ensures that we always store data in a consistent format.
const schema = {
	BhRestToken: {
		type: 'string',
		description: 'The session token (access_token) for the Bullhorn REST API.'
	},
	restUrl: {
		type: 'string',
		format: 'uri',
		description: 'The unique base URL for API requests, received after login.'
	},
	refreshToken: {
		type: 'string',
		description: 'The refresh token used to obtain a new BhRestToken when the current one expires.'
	}
};

// Initialize the configuration store.
// `conf` will automatically handle creating and managing a JSON file
// in the proper user-level config directory for the operating system.
// (e.g., ~/.config/bh-cli on Linux)
const config = new Conf({
    projectName: 'bh-cli',
    schema: schema,
    // You can set default values here if needed, but for auth tokens,
    // it's better to leave them undefined.
});

// We export the initialized instance directly.
// Other parts of our app can now import this and use it like:
// import config from './lib/config.js';
// config.set('restUrl', 'https://...');
// const token = config.get('BhRestToken');
export default config;