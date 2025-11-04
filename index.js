require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const { error } = require('console');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//MongoDB Database Config Setup
mongoose.connect(process.env.MONGO_URI)

const Schema = mongoose.Schema;

const UrlSchema = new Schema({
  original_url: {
    type: String, required: true
  },
  short_url: {
    type: Number, required: true, unique: true
  }
})

const UrlModel = mongoose.model('url', UrlSchema)

const getHostName = (urlString) => {
  const parsed = new Url(urlString);
  return parsed.hostname
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", (req, res) => {

  const {url: iputtedurl} = req.body

  const hostname = new URL(iputtedurl).hostname

  dns.lookup(hostname, async (err, address, family) => {
    if(err) {
      console.error(`DNS lookup failed: ${err.message}`);
      return res.json({
        error: "invalid url"
      })
    } else {
      // const shortId = urlDatabase.length + 1;

      const existing = await UrlModel.findOne({original_url: iputtedurl}).exec();

      if(existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url
        })
      }

      const count = await UrlModel.countDocuments().exec()
      const nextShort = count + 1;

      const newDoc = new UrlModel ({
        original_url: iputtedurl,
        short_url: nextShort
      })

      const saved = await newDoc.save();

      return res.json({
        original_url: saved.original_url,
        short_url: saved.short_url
      })
    }   
  })
})

app.get("/api/shorturl/:short", async (req,res) => {
  // const { short } = parseInt(req.params)
  const short = parseInt(req.params.short);

  if(Number.isNaN(short)) {
    return res.json({
      "error":"No short URL found for the given input"
    })
  }

  try {
    const doc = await UrlModel.findOne({ short_url: short }).exec();
    if(!doc) {
      return res.json({
        error: "No short URL found for the given input"
      })
    }

    // Redirect to original URL
    return res.redirect(doc.original_url);

  } catch (err) {
    console.log('DB error', err);
    return res.status(500).json({ error: "server error"})
  }

});

app.get('/', (req, res) => {
  res.send('URL Shortener Microservice. POST to /api/shorturl');
})

// app.post("/api/shorturl", (req, res) => {
//    const useurl = req.body.url

//   try {

//     const hostname = new URL(useurl).hostname

//     dns.lookup(hostname, (err, address) => {
//       if(err) {

//         console.log("DNS lookup failed:", err.message);
//         return res.json({
//           error: "invalid url"
//         })
//       } else {
//         console.log("Resolved Address:", address);
//       res.json({
//     original_url: useurl, short_url: 42342
//   })
//       }

       
//     })

//   } catch {
//     res.json({
//           error: "invalid url"
//         })
//   }

  

//   // dns.lookup(inputtedurl, (err,address) => {
//   //   if(err) {
//   //     console.log("DNS lookup failed:", err.message)
//   //     return res.json({
//   //       error: "invalid url"
//   //     })
//   //   } 

//   //   console.log("Resloved Address:", address)

//   //   res.json({
//   //   original_url: inputtedurl, short_url: 42342
//   // })
//   // })

  
// })


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
