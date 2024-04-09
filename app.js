const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')
app.use(express.json())

const PORT = process.env.PORT ?? 3000

/* app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Nor allowed by CORS'))
  }
})) */

app.get('/', (req, res) => {
  res.json({ message: 'Hola mundo' })
})

// Todos los recuersos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    )
    res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  // path to regexp, los endpoints se puede escribir regexp
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)

  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  console.log(req.body)
  if (req.body === undefined) {
    return res.status(403).json({ message: 'Invalid info' })
  }
  const result = validateMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // UUID v4
    ...result.data
  }
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) return res.status(404).json({ message: 'Movie not found' })

  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  res.status(201).json(updateMovie)
})

/* Cuando hjacemos una peticion de una página web a nuestro servidor, nos da el problema de Pre-flight CORS. Se tienen que mandar cabeceras desde una url del mismo nombre pero con el OPTION para asignarle las cabeceras */

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})
