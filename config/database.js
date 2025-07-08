const dotenv = require('dotenv');
dotenv.config();

const MongoClient = require('mongodb').MongoClient;

let database;

const initDb = async () => {
    if(database) {
        console.log('Db is already initialized!')
        return
    }

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');
        database = client.db();
        return database;
    } catch (err) {
        console.error('Error connecting to MOngoDB:', err);
        throw err;
    }
};

const getDatabase = () => {
    if (!database) {
        throw new Error('Database not initialized');
    }
    return database;
};

module.exports = {
    initDb,
    getDatabase
};
