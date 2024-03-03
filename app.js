const express = require("express");
const { connectToDb, getDb } = require("./db");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const { credentialResponseDecoded } = require("./decodeCreds");
const { jwtDecode } = require ("jwt-decode");

//bad words npm package filter.clean("string") 
const Filter = require('bad-words');
const filter = new Filter();  
// or const filter = new Filter({ placeHolder: 'x'});

// const cors = require('cors');
// init app & middleware

const app = express();
app.use(cors());
app.use(express.json()); //both can be use. cors for cross origin on local host.
// db connection

const CLIENT_ID =
  "664807478784-95m0jem6mgo0b2bl458p10s34ik4cpe9.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);


function generateDateString() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  const dateString = `${day}-${month}-${year}`;
  return dateString;
}
// Function to exchange authorization code for access token
// async function exchangeAuthorizationCodeForAccessToken(authorizationCode) {
//   try {
//     const tokenResponse = await client.tokenRequest({
//       client_id: CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET, // Access secret from environment variable
//       grant_type: "authorization_code",
//       // redirect_uri: "http://localhost:5173", // Replace with your redirect URI
//       code: authorizationCode,
//     });

//     return tokenResponse.access_token;
//   } catch (error) {
//     console.error(error);
//     throw new Error("Failed to exchange authorization code for access token");
//   }
// }

// // Function to validate access token
// async function validateAccessToken(accessToken) {
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: accessToken,
//       audience: CLIENT_ID, // Ensure audience matches your client ID
//     });

//     const payload = ticket.getPayload();

//     return {
//       isValid: true,
//       payload: payload, // Contains user information like email and profile picture
//     };
//   } catch (error) {
//     console.error(error);
//     return { isValid: false };
//   }
// }

// async function verifyIdToken(idToken) {
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: CLIENT_ID,
//     });
//     const payload = ticket.getPayload();
//     return payload;
//   } catch (error) {
//     console.error('Error verifying JWT:', error.message);
//     throw new Error('Failed to verify JWT: ' + error.message);  
//   }
// }

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

app.get("/userPosts/:email", (req, res) => {
  const email = req.params.email;
  db.collection("blogspostUsers")
    .findOne({ email: email })
    .then((user) => {
      if (user) {
        res.status(200).json({userPosts : user.userPosts});
      } else {
        res.status(404).json({ mssg: "user not found" });
      }
    })
    .catch(() => {
      res.status(500).json({ mssg: "error getting user posts" });
    });
});

app.post("/loginUser", async (req, res) => {
  // const authCode = req.body.authCode;
  const jwtCode = req.body.credential;
    try {
      // Decode the JWT code to extract payload
      const payload = jwtDecode(jwtCode);
  
      // Extract necessary user information from the payload
      const email = payload.email;
      const picture = payload.picture;
      const given_name = payload.given_name;
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
          res.status(500).json({ mssg: "error finding user.",err:err });
        });
    } catch (error) {
      console.error('Error processing login:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

});

app.post("/newPost", (req, res) => {
  const newItems = req.body;
  const Title = filter.clean(newItems.title);
  const Content = filter.clean(newItems.content);
  const email = newItems.email;
  const author = newItems.given_name;
  const dateString =  generateDateString()
  const img ="https://loremflickr.com/640/360"
  const newPost = { title: Title, content: Content, author: author,email: email , date: dateString, img: img };

  db.collection("TheBLOGSPOsT")
    .insertOne( newPost )
    .then(() => {
      db.collection("blogspostUsers")
    .updateOne(
      { email: email },
      { $push: { userPosts: newPost } }
    )
    .then((result) => {
      if(result.matchedCount > 0) {
        res.status(200).json({ message: "User's post updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error updating user's post", error: err });
    });
    })
    .catch((err) => {
      res.status(500).json({ message: "Error creating new document", error: err });
    });
});



app.delete("/deletePost", (req, res) => {
  const postId = req.query.postId;
  const email = req.query.email;

  if (ObjectId.isValid(postId)) {
    db.collection("TheBLOGSPOsT")
      .deleteOne({ _id: new ObjectId(postId) })
      .then(() => {
        db.collection("blogspostUsers")
          .updateOne(
            { email: email },
            { $pull: { userPosts: { _id: new ObjectId(postId) } } }
          )
          .then((result) => {
            if (result.matchedCount > 0) {
              res.status(200).json({ mssg: "User's post deleted successfully" });
            } else {
              res.status(404).json({ mssg: "User/Post not found" });
            }
          })
          .catch((err) => {
            res.status(500).json({
              mssg: "error deleting user's post",
              error: err,
            });
          });
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
// app.patch("/posts/:id", (req, res) => {
//   const updates = req.body;
//   if (ObjectId.isValid(req.params.id)) {
//     db.collection("TheBLOGSPOsT")
//       .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
//       .then((result) => {
//         res.status(200).json(result);
//       })
//       .catch((err) => {
//         res
//           .status(500)
//           .json({ error: "error updating document/couldn't update document" });
//       });
//   } else {
//     res.status(500).json({ err: "invalid document id" });
//   }
// });
