const express = require('express')
const app = express()
const cors = require('cors')
const { randomBytes } = require('crypto')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// The project stores data in memory, so it resets whenever the server restarts.
const users = []
const makeId = () => randomBytes(12).toString('hex')

app.post('/api/users', (req, res) => {
  const user = { username: req.body.username, _id: makeId(), exercises: [] }
  users.push(user)
  res.json({ username: user.username, _id: user._id })
})

app.get('/api/users', (req, res) => {
  res.json(users.map(({ username, _id }) => ({ username, _id })))
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(({ _id }) => _id === req.params._id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const date = req.body.date ? new Date(req.body.date) : new Date()
  const exercise = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date
  }
  user.exercises.push(exercise)
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(({ _id }) => _id === req.params._id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  let exercises = user.exercises.slice()
  if (req.query.from) {
    const from = new Date(req.query.from)
    if (!Number.isNaN(from.getTime())) exercises = exercises.filter(({ date }) => date >= from)
  }
  if (req.query.to) {
    const to = new Date(req.query.to)
    if (!Number.isNaN(to.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.to)) to.setHours(23, 59, 59, 999)
      exercises = exercises.filter(({ date }) => date <= to)
    }
  }
  const count = user.exercises.length
  if (req.query.limit !== undefined) {
    const limit = Number.parseInt(req.query.limit, 10)
    if (Number.isFinite(limit) && limit >= 0) exercises = exercises.slice(0, limit)
  }

  res.json({
    username: user.username,
    count,
    _id: user._id,
    log: exercises.map(({ description, duration, date }) => ({
      description,
      duration,
      date: date.toDateString()
    }))
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
