// Load Environment Variables from the .env file
require('dotenv').config();


// Application Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const client = require('./lib/client.js');
const request = require('superagent');

// Initiate database connection
client.connect();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(morgan('dev')); // http logging
app.use(cors()); // enable CORS request
app.use(express.static('public')); // server files from /public folder
app.use(express.json()); // enable reading incoming json data
app.use(express.urlencoded({ extended:true })); //security parsing an encoded url


// Auth Routes
const createAuthRoutes = require('./lib/auth/create-auth-routes');

const authRoutes = createAuthRoutes({
    selectUser(email) {
        return client.query(`
            SELECT id, email, hash 
            FROM users
            WHERE email = $1;
        `,
        [email]
        ).then(result => result.rows[0]);
    },
    insertUser(user, hash) {
        return client.query(`
            INSERT into users (email, hash)
            VALUES ($1, $2)
            RETURNING id, email;
        `,
        [user.email, hash]
        ).then(result => result.rows[0]);
    }
});

//before ensure auth, but after other middleware... 
//the create-auth-route will be on top of this... 
//so api/auth/signup... or api/auth/signin

app.use('/api/auth', authRoutes);

//for every route make sure there is a token
const ensureAuth = require('./lib/auth/ensure-auth');

app.use('/api', ensureAuth);

//API ROUTES!!!
app.get('/api', (req, res) => {
    res.send('hello josh...');
});

app.get('/api/search/quotes', async(req, respond, next) => {
    try { //look at the query params and location
        const query = req.query.search; 
        console.log(req.query.search);
        //hide the key
        const result = await request.get(`https://futuramaapi.herokuapp.com/api/quotes?search=${query}`);
    
        respond.json(result.body);
    } catch (err) {
        next(err);
    }
});

app.get('/api/favorites', async(req, res) => {
    try {
        const myQuery = `
            SELECT * FROM favorites
            WHERE user_id=$1
        `;
        
        const favorites = await client.query(myQuery, [req.userId]);
        
        res.json(favorites.rows);

    } catch (e) {
        console.error(e);
    }
});

app.delete('/api/favorites/:id', async(req, res) => {
    try {
        const myQuery = `
            DELETE FROM favorites
            WHERE id=$1
            RETURNING *
        `;
        
        const favorites = await client.query(myQuery, [req.params.id]);
        
        res.json(favorites.rows);

    } catch (e) {
        console.error(e);
    }
});

app.post('/api/favorites', async(req, res) => {
    try {
        const {
            name,
            age,
            species,
            pic_url,
        } = req.body;

        const newFavorites = await client.query(`
            INSERT INTO favorites (name, age, species, pic_url, user_id)
            values ($1, $2, $3, $4, $5)
            returning *
        `, [
            name,
            age,
            species,
            pic_url, 
            req.userId,
        ]);

        res.json(newFavorites.rows[0]);

    } catch (e) {
        console.error(e);
    }
});





app.get('/api/search/characters', async(req, respond, next) => {
    try { //look at the query params and location
        const query = req.query.search; 
        console.log(req.query.search);
        //hide the key
        const result = await request.get(`https://futuramaapi.herokuapp.com/api/v2/characters?search=${query}`);
    
        respond.json(result.body);
    } catch (err) {
        next(err);
    }
});

app.get('*', (req, res) => {
    res.send('404 error... ಠ_ಠ  you done goofed! (ง •̀_•́)ง ');
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log('server running on PORT', PORT);
});