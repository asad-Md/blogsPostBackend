const { MongoClient } = require('mongodb');

let uri = 'mongodb+srv://muff:muff321@muffin.fnwewec.mongodb.net/?retryWrites=true&w=majority'

let dbConnection

module.exports = {
    connectToDb: (cb)=>{
        MongoClient.connect(uri) //mongodb://localhost:27017
        .then((client)=>{
            dbConnection = client.db('muffin') //name of db
            return cb()
        })
        .catch((err)=>{
            console.log(err)
            return cb(err)
        })
    },
    getDb: ()=>dbConnection
}