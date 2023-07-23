const {Client} = require("pg");

const client = new Client({
    host: "localhost",
    port: 5432,
    database: "the name of the database used",
    user: "postgres",
    password: "your password"
})

client.connect();

module.exports.clientPG = client;