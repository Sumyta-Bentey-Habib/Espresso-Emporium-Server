const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USERS}:${process.env.DB_PASSWORD}@cluster0.uteipwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    console.log("Connected to MongoDB!");
    const db = client.db("espressoDB");

    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const cartCollection = db.collection("cart");
    const reviewsCollection = db.collection("reviews");

    // ----------------- USERS -----------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const existing = await usersCollection.findOne({ email: user.email });
      if (existing) return res.status(200).json({ message: "User already exists" });
      const result = await usersCollection.insertOne(user);
      res.status(201).json(result);
    });

    app.get("/users/:uid", async (req, res) => {
      const { uid } = req.params;
      let user = ObjectId.isValid(uid) ? await usersCollection.findOne({ _id: new ObjectId(uid) }) : null;
      if (!user) user = await usersCollection.findOne({ email: uid });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    });

    app.get("/users", async (req, res) => {
      const { role, search } = req.query;
      const query = {};
      if (role) query.role = role;
      if (search) query.name = { $regex: search, $options: "i" };
      const users = await usersCollection.find(query).toArray();
      res.json(users);
    });

    app.put("/users/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      res.json(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const { id } = req.params;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // ----------------- PRODUCTS -----------------
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.status(201).json(result);
    });

    app.get("/products", async (req, res) => {
      const { search } = req.query;
      const query = search
        ? { $or: [{ name: { $regex: search, $options: "i" } }, { company: { $regex: search, $options: "i" } }] }
        : {};
      const products = await productsCollection.find(query).toArray();
      res.json(products);
    });

    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    });

    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      const result = await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      res.json(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // ----------------- CART -----------------
    app.post("/cart", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.status(201).json(result);
    });

    app.get("/cart/:buyerId", async (req, res) => {
      const { buyerId } = req.params;
      const cartItems = await cartCollection.find({ buyerId }).toArray();
      res.json(cartItems);
    });

    app.delete("/cart/:cartItemId", async (req, res) => {
      const { cartItemId } = req.params;
      const result = await cartCollection.deleteOne({ _id: new ObjectId(cartItemId) });
      res.json(result);
    });

    // ----------------- REVIEWS -----------------
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      review.createdAt = new Date();
      const result = await reviewsCollection.insertOne(review);
      res.status(201).json(result);
    });

    app.get("/reviews/:coffeeId", async (req, res) => {
      const { coffeeId } = req.params;
      const reviews = await reviewsCollection.find({ coffeeId }).toArray();
      res.json(reviews);
    });

    // DELETE review: Only Admin or Seller of the coffee
    app.delete("/reviews/:id", async (req, res) => {
      const { id } = req.params;
      const { requesterId } = req.query;

      if (!ObjectId.isValid(id) || !ObjectId.isValid(requesterId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
      if (!review) return res.status(404).json({ message: "Review not found" });

      const requester = await usersCollection.findOne({ _id: new ObjectId(requesterId) });
      if (!requester) return res.status(403).json({ message: "Unauthorized" });

      const coffee = await productsCollection.findOne({ _id: new ObjectId(review.coffeeId) });
      if (!coffee) return res.status(404).json({ message: "Coffee not found" });

      if (requester.role !== "Admin" && requester.email !== coffee.sellerEmail) {
        return res.status(403).json({ message: "Permission denied: Only Admin or Seller can delete this review" });
      }

      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({ message: "Review deleted successfully", result });
    });

    // ----------------- ADMIN STATS -----------------
    app.get("/admin/stats", async (req, res) => {
      const totalBuyers = await usersCollection.countDocuments({ role: "Buyer" });
      const totalSellers = await usersCollection.countDocuments({ role: "Seller" });
      const totalProducts = await productsCollection.countDocuments();
      const totalReviews = await reviewsCollection.countDocuments();
      res.json({ totalBuyers, totalSellers, totalProducts, totalReviews });
    });

  } finally {
    // optional cleanup
  }
}

run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Espresso-Emporium listening on port ${port}`));
