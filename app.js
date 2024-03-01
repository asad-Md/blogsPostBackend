const express = require("express");
const { connectToDb, getDb } = require("./db");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const { credentialResponseDecoded } = require("./decodeCreds");
// const cors = require('cors');

// init app & middleware

const app = express();
app.use(cors());
app.use(express.json()); //both can be use. cors for cross origin on local host.
// db connection

const CLIENT_ID =
  "664807478784-95m0jem6mgo0b2bl458p10s34ik4cpe9.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);

// Function to exchange authorization code for access token
async function exchangeAuthorizationCodeForAccessToken(authorizationCode) {
  try {
    const tokenResponse = await client.tokenRequest({
      client_id: CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET, // Access secret from environment variable
      grant_type: "authorization_code",
      // redirect_uri: "http://localhost:5173", // Replace with your redirect URI
      code: authorizationCode,
    });

    return tokenResponse.access_token;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to exchange authorization code for access token");
  }
}

// Function to validate access token
async function validateAccessToken(accessToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: CLIENT_ID, // Ensure audience matches your client ID
    });

    const payload = ticket.getPayload();

    return {
      isValid: true,
      payload: payload, // Contains user information like email and profile picture
    };
  } catch (error) {
    console.error(error);
    return { isValid: false };
  }
}

let db;
connectToDb((err) => {
  if (!err) {
    app.listen(3000, () => {
      console.log("Server/app is running on port 3000");
    });
    db = getDb();
  }
});

// Path: post1/app.js

//routes

app.get("/posts1", (req, res) => {
  let posts = []; // any name for storing data collection.

  //curr page
  const page = req.query.page || 0; //default page is 0
  //or req.query.p ... name of parameter of query is optional.
  //or req.query.page ? req.query.page : 0     does same thing

  const docsPerPage = 10; //can be any number for every page.

  db.collection("TheBLOGSPOsT")
    .find()
    .sort({ date: -1 })
    .skip(page * docsPerPage)
    .limit(docsPerPage)
    .forEach((post) => posts.push(post))
    .then(() => {
      res.status(200).json(posts);
    })
    .catch(() => {
      res.status(500).json({ mssg: "error getting posts" });
    });
});

app.get("/posts/id/:id", (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db.collection("TheBLOGSPOsT")
      .findOne({ _id: new ObjectId(req.params.id) })
      .then((post) => {
        res.status(200).json(post);
      })
      .catch(() => {
        res.status(500).json({ err: "error getting/fetching document" });
      });
  } else {
    res.status(500).json({ err: "invalid id" });
  }
});

app.get("/posts/page/:page", (req, res) => {
  let posts = []; // any name for storing data collection.

  //curr page
  const page = req.params.page || 0; //default page is 0
  //or req.query.p ... name of parameter of query is optional.
  //or req.query.page ? req.query.page : 0     does same thing
  const docsPerPage = 10; //can be any number for every page.

  db.collection("TheBLOGSPOsT")
    .find()
    .sort({ date: -1 })
    .skip(page * docsPerPage)
    .limit(docsPerPage)
    .forEach((post) => posts.push(post))
    .then(() => {
      res.status(200).json(posts);
    })
    .catch(() => {
      res.status(500).json({ mssg: "error getting posts" });
    });
});

app.post("/loginUser", async (req, res) => {
  const authCode = req.body.code;

  try {
    const accessToken = await exchangeAuthorizationCodeForAccessToken(authCode);
    const validationResult = await validateAccessToken(accessToken);

    if (validationResult.isValid) {
      const email = validationResult.payload.email;
      const picture = validationResult.payload.picture;
      const given_name = validationResult.payload.given_name;
      db.collection("blogspostUsers")
        .findOne({ email: email })
        .then((userDetails) => {
          if (userDetails) {
            console.log("User exists");
            res.status(200).json(userDetails);
          } else {
            console.log("User does not exist");
            const newUserDetails = {
              email: email,
              given_name: given_name,
              picture: picture,
              userPosts: [],
            };
            db.collection("blogspostUsers")
              .insertOne(newUserDetails)
              .then((result) => {
                res.status(201).json(newUserDetails);
              })
              .catch((err) => {
                res.status(500).json({ err: "error creating new document." });
              });
          }
        })
        .catch((err) => {
          res.status(500).json({ err: "error finding user." });
        });
      // Use user information in your application logic securely (e.g., create or update user session) 
    } else {
      res.status(401).json({ message: "Invalid access token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/posts", (req, res) => {
  const post = req.body;
  db.collection("TheBLOGSPOsT")
    .insertOne(post)
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((err) => {
      res.status(500).json({ err: "error creating new document" });
    });
});

app.delete("/posts/:id", (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db.collection("TheBLOGSPOsT")
      .deleteOne({ _id: new ObjectId(req.params.id) })
      .then(() => {
        res.status(200).json(result);
      })
      .catch(() => {
        res
          .status(500)
          .json({ err: "error deleting document/couldn't delete document" });
      });
  } else {
    res.status(500).json({ err: "invalid id" });
  }
});

app.patch("/posts/:id", (req, res) => {
  const updates = req.body;
  if (ObjectId.isValid(req.params.id)) {
    db.collection("TheBLOGSPOsT")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ error: "error updating document/couldn't update document" });
      });
  } else {
    res.status(500).json({ err: "invalid document id" });
  }
});
