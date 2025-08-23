const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USERS}:${process.env.DB_PASSWORD}@cluster0.uteipwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
    //await client.connect();
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
  
     //user collection in database
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const db = client.db("espressoDB"); 
    const usersCollection = db.collection("users");

    // check if user already exists
    const existing = await usersCollection.findOne({ email: user.email });
    if (existing) {
      return res.status(200).json({ message: "User already exists" });
    }

    const result = await usersCollection.insertOne(user);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  
finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Espresso-Emporium is listen ${port}`)
})
