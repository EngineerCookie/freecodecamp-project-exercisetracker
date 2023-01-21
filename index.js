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
  let date = new Date("2023-01-03").toDateString()
  let user = "Leon";
  let db = await User.aggregate([
    { $match: { username: "Tenshi" } },
    { $project: { 
      username: "$username", 
      description: { $arrayElemAt: ["$log.description", -1] },
      date: {$arrayElemAt: ["$log.date", -1]},
      duration: {$arrayElemAt: ["$log.duration",  -1]} 
    }},
  ]);

  res.json(db[0]);
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
  let date = new Date(req.body.date).toDateString();
  await User.findOneAndUpdate(
    { _id: req.params._id },
    {
      $push: {
        log: {
          $each: [{
            description: req.body.description,
            duration: req.body.duration,
            date: date
          }]
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
        date: { $arrayElemAt: ["$log.date", -1] },
        duration: { $arrayElemAt: ["$log.duration", -1] }
      }
    },
  ])
  res.json(db[0])
});
/*
- You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.

- The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.

{
  username: "fcc_test",
  description: "test",
  duration: 60,
  date: "Mon Jan 01 1990",
  _id: "5fb5853f734231456ccb3b05"
}
*/

app.get('/api/users/:_id/logs', (req, res) => {
  res.send('WIP');
});
/*
- You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.

- A request to a user's log GET /api/users/:_id/logs returns a user object with a count property representing the number of exercises that belong to that user.

- A GET request to /api/users/:_id/logs will return the user object with a log array of all the exercises added.

- Each item in the log array that is returned from GET /api/users/:_id/logs is an object that should have a description, duration, and date properties.

- The description property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string.

- The duration property of any object in the log array that is returned from GET /api/users/:_id/logs should be a number.

- The date property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string. Use the dateString format of the Date API.

- You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
