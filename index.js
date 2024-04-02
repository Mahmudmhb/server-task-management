const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const app = express()
require('dotenv').config()


const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors({
  origin: '*',
  credentials: true
}))
app.use(cookieParser())


const logger = async (req,res, next)=> {
  next()
}
const verifyToken = async(req,res, next)=> {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'not Authorized'})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECTET, (err, decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message: 'not Authorized'})
    }
      req.user = decoded;

      next()
  })
}
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.SECRET_NAME}:${process.env.SECRET_KEY}@cluster0.gegfn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});





async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

// create database 
const tasksCollection = client.db('task-management').collection('tasks')
const userCollection = client.db('task-management').collection('users')

app.post('/jwt',  async(req,res)=>{
  const user = req.body
  // const token = jwt.sign(user, 'secret', {expiresIn: '1h'})
  // res.send(token)
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECTET, { expiresIn: '1h' });
 res.cookie('token', token,{httpOnly:true, secure: none, 
  })
  .send({success: true})
})

// get tasks 
app.get('/tasks',   async(req,res)=>{
  let query = {};
  if (req.query?.email) {
      query = { userEmail: req.query.email }}

    res.send(await tasksCollection.find(query).toArray())
})
app.get('/users',   async(req,res)=>{
    res.send(await userCollection.find().toArray())
})

app.get('/task/:id',  async(req,res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    res.send (await tasksCollection.findOne(query))  
})
app.get('/tasks/:userEmail',logger,verifyToken, async(req,res)=>{

  if(req.params.userEmail !== req.user.email){
    return res.status(403).send({message:'forbidden Access'})
  }
      const email = req.params.userEmail
    const filter = {userEmail: email}
    res.send(await tasksCollection.find(filter).toArray())

})

app.get('/taskstatus/:status', async(req,res)=>{
  const status = req.params.status;
  console.log(status);
  const filter = {status: status }
  console.log(filter);
  res.send(await tasksCollection.find(filter).toArray())

})
// post tasks 



app.post('/tasks',  async(req, res)=>{
  const task = req.body;
  res.send(await tasksCollection.insertOne(task));
});

app.post('/users',  async(req, res)=>{
  const user = req.body.email;
  // console.log(id);
  const newUser = req.body;
  const query = {email: user}
  const result = await userCollection.findOne(query)
  if(result){
    return res.send( {message: 'user alreay have', insertId: null})
  }
  // console.log(wishlist)
  res.send(await userCollection.insertOne(newUser))

})



// update tasks 
app.put('/tasks/:id', async(req,res)=>{
    const id = req.params.id
    const tasks = req.body
    const filter = {_id: new ObjectId(id)};
    const options = { upsert: true };
    const updateDoc = {
        $set: {
          heading: tasks.heading,
          description: tasks.description,
          date: tasks.date,
          status: tasks.status,
          userEmail: tasks.userEmail,
          update: tasks.update
        },
        
      };
      res.send(await tasksCollection.updateOne(filter, updateDoc, options))
})


// delete  tasks 
app.delete('/tasks/:id', async(req, res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    res.send(await tasksCollection.deleteOne(filter))
})

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', async(req,res)=>{

    res.send('task server is running')
})

app.listen(port, async(req,res)=>{
    console.log('port is running ', port);
})