import { config } from 'dotenv';

// import envs
config();

console.log('Server started!');
console.log('HEROKU_APP_URL', process.env.HEROKU_APP_URL);
