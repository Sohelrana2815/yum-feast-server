const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// Middleware

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5q2fm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017/";

console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("YUM_FEAST_DB").collection("users");
    const menuCollection = client.db("YUM_FEAST_DB").collection("menus");
    const reviewCollection = client.db("YUM_FEAST_DB").collection("reviews");
    const cartCollection = client.db("YUM_FEAST_DB").collection("carts");

    // jwt related api

    app.post("/jwt", async (req, res) => {
      const userEmail = req.body;
      // console.log(userEmail);
      const token = jwt.sign(userEmail, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //

    const verifyToken = async (req, res, next) => {
      console.log("inside verify token middleware : ", req.headers);

      next();
    };

    // user related api

    app.get("/users", verifyToken, async (req, res) => {
      console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // post api
    app.post("/users", async (req, res) => {
      const user = req.body;

      // only insert user if user does not exist
      // many ways i can do this (1. email unique, 2. upsert , simple checking )

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "This user is already exist" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // patch api

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete api
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // menus related apis
    app.get("/menus", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    // carts collection

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      console.log("get email from client", email);
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      console.log(cartItem);

      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("YUM FEAST SERVER IS RUNNING");
});

app.listen(port, () => {
  console.log(`YUM FEAST SERVER IS RUNNING ON PORT ${port}`);
});

/**
 * ------------
 * NAMING CONVENTION
 * ---------------
 * app.get('/users')
 * app.get('/users/:id')
 * app.post('/users')
 * app.put('/users/:id')
 * app.patch('/users/:id')
 * app.delete('/users/:id')
 */
