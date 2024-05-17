const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const path = require('path'); 
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const port_number = 5000;
const uri = process.env.MONGO_CONNECTION_STRING;

const databaseAndCollection = {db: "Bakery", collection:"orders"};
const { MongoClient, ServerApiVersion } = require('mongodb');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/docs');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("index");
});

// just returns back to index page or home page after clicking home 
app.get("/index.ejs", (req,res) => {
    res.render("index");
    
});

app.get("/order.ejs", (req,res)=> {
    res.render("order");
});

app.post("/ordersubmitted", async (req,res) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    const {first_name} = req.body
    let order = {
        name: first_name
        
    };
    
    let gender;
    let probability;
    try {
        let response = await fetch(`https://api.genderize.io?name=${first_name}`);
        let data = await response.json();
        gender = data.gender;
        probability = data.probability;
        order.gender = gender;
        order.probability = probability;
    } catch (error) {
        console.error(error);
    }
   
    try {
        await client.connect();
       
        await insertItem(client, databaseAndCollection, order);

        let result = "<h2>Your Gender</h2>"
        result += "Name: " + first_name +"<br>"
        result += "Gender: " + gender +  "<br>"
        result += "Probability: " + probability * 100 + "%" + "<br>"
        result += "<a class='home' href='/index.ejs'>Home</a>";
        res.send(result);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.get("/orderhistory", async (req,res) => {
    
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
        
        const result = await cursor.toArray();
        res.send(result)
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    
})

async function insertItem(client, databaseAndCollection, orders) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(orders);
}

app.listen(port_number);