const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
let mongoose = require('mongoose');



app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: false }));

mongoose.connect(process.env.URI_EXERCISE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

let userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  log: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ]
});

let User = mongoose.model('User', userSchema);

app.get('/test', async (req, res) => {
  res.send('aloha');
});


app.post('/api/users', async (req, res) => {
  try {
    let result = await User.findOneAndUpdate(
      { username: req.body.username },
      { $setOnInsert: { username: req.body.username } },
      {
        new: true,
        upsert: true
      }
    ).select({ username: 1, _id: 1 });

    res.json(result);
  } catch {
    res.send('Error')
  }

});

app.get('/api/users', async (req, res) => {
  let result = await User.find().select({ username: 1, _id: 1 });
  res.json(result);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let date = (req.body.date == '') ? new Date().toDateString() : new Date(req.body.date).toDateString();

  await User.findOneAndUpdate(
    { _id: req.params._id },
    {
      $push: {
        log: {
            description: req.body.description,
            duration: req.body.duration,
            date: date
        }
      }
    },
    { new: true }
  );
  let db = await User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(`${req.params._id}`) } },
    {
      $project: {
        username: "$username",
        description: { $arrayElemAt: ["$log.description", -1] },
        date: date,
        duration: { $arrayElemAt: ["$log.duration", -1] }
      }
    },
  ])
  res.json(db[0])
});

app.get('/api/users/:_id/logs', async (req, res) => {
  let result = await User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(`${req.params._id}`) } },
    {
      $project: {
        "username": 1,
        "log": 1,
      }
    }
  ]);

  if (req.query.from || req.query.to) {
    let dateFrom = new Date(0);
    let dateTo = new Date();

    if(req.query.from) {
      dateFrom = new Date(req.query.from);
    }
    if (req.query.to) {
      dateTo = new Date(req.query.to);
    }
    result[0].log = result[0].log.filter((entry) => {
      return new Date(entry.date) >= dateFrom && new Date(entry.date)<= dateTo;
    })
  }

  if (req.query.limit) {
    result[0].log = result[0].log.slice(0, req.query.limit)
  }

  result[0].count = result[0].log.length;

  res.send(result[0]);
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
