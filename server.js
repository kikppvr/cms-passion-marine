// Entry point for Plesk Passenger
process.argv.splice(2, 0, 'start');
import('./node_modules/directus/cli.js').catch(console.error);
