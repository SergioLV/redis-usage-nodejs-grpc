const {Pool} = require('pg');

const connectionData = {
    user:'postgres',
    host:'localhost',
    database:'websites_database',
    password:'distribuidos',
    port:9091
}

const client = new Pool(connectionData)

module.exports = {client};