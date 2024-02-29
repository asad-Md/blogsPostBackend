const express = require('express')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb');
const cors = require('cors');
// const cors = require('cors');


// init app & middleware

const app = express()
app.use(cors());
app.use(express.json())  //both can be use. cors for cross origin on local host.
// db connection

let db;
connectToDb((err)=>{ 
    if (!err){
        app.listen(3000, () => {
        console.log('Server/app is running on port 3000')
        })
        db=getDb()
    }    
 })

// Path: post1/app.js

//routes 

app.get('/posts1', (req, res) => {
    let posts=[] ;  // any name for storing data collection.

    //curr page 
    const page = req.query.page || 0;  //default page is 0
                //or req.query.p ... name of parameter of query is optional.   
                //or req.query.page ? req.query.page : 0     does same thing                                         

    const docsPerPage = 10; //can be any number for every page.

    db.collection('TheBLOGSPOsT')
    .find()
    .sort({date: -1})
    .skip(page * docsPerPage)
    .limit(docsPerPage)
    .forEach(post => posts.push(post))
    .then (() =>{
        res.status(200).json(posts)
    })
    .catch(()=>{
        res.status(500).json({mssg: 'error getting posts'})
    })
})

app.get('/posts/id/:id', (req, res) => {
    if (ObjectId.isValid(req.params.id)){
        db.collection('TheBLOGSPOsT')
        .findOne({_id: new ObjectId(req.params.id)})
        .then(post => {
            res.status(200).json(post)
        })
        .catch(()=>{
            res.status(500).json({err: 'error getting/fetching document'})
        })
    }else{
        res.status(500).json({err: 'invalid id'})
    }
})

app.get('/posts/page/:page', (req, res) => {
    let posts=[] ;  // any name for storing data collection.

    //curr page 
    const page = req.params.page || 0;  //default page is 0
                //or req.query.p ... name of parameter of query is optional.   
                //or req.query.page ? req.query.page : 0     does same thing                                         
    const docsPerPage = 10; //can be any number for every page.

    db.collection('TheBLOGSPOsT')
    .find()
    .sort({date: -1})
    .skip(page * docsPerPage)
    .limit(docsPerPage)
    .forEach(post => posts.push(post))
    .then (() =>{
        res.status(200).json(posts)
    })
    .catch(()=>{
        res.status(500).json({mssg: 'error getting posts'})
    })
})


app.post('/posts', (req, res) => {
    const post = req.body
    db.collection('TheBLOGSPOsT')
    .insertOne(post)
    .then((result) => { 
        res.status(201).json(result)
    })
    .catch((err)=>{
        res.status(500).json({err: 'error creating new document'})
    })
})

app.delete('/posts/:id', (req, res) => {
    if (ObjectId.isValid(req.params.id)){
        db.collection('TheBLOGSPOsT')
        .deleteOne({_id: new ObjectId(req.params.id)})
        .then(()=>{
            res.status(200).json(result)
        })
        .catch(()=>{
            res.status(500).json({err: "error deleting document/couldn't delete document"})
        })
    }
    else{
        res.status(500).json({err: 'invalid id'})
    }
})

app.patch('/posts/:id', (req, res) => {
    const updates = req.body
    if (ObjectId.isValid(req.params.id)){
        db.collection('TheBLOGSPOsT')
        .updateOne({_id: new ObjectId(req.params.id)}, {$set: updates})
        .then((result)=>{
            res.status(200).json(result)  
        })
        .catch((err)=>{
            res.status(500).json({error: "error updating document/couldn't update document"})
        })
    }
    else{
        res.status(500).json({err: 'invalid document id'})
    }
})