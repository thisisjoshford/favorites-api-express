const client = require('../lib/client');

run();

async function run() {

    try {
        // run a query to create tables
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(256) NOT NULL,
                hash VARCHAR(512) NOT NULL
            );
        
            CREATE TABLE favorites (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                age INTEGER NOT NULL,
                species VARCHAR(256) NOT NULL,
                pic_url VARCHAR(256) NOT NULL,
                user_id INTEGER NOT NULL REFERENCES users(id)
            );
        `);

        console.log('create tables complete');
    }
    catch (err) {
        // problem? let's see the error...
        console.log(err);
    }
    finally {
        // success or failure, need to close the db connection
        client.end();
    }
    
}