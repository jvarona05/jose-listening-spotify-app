import express from 'express'
import axios from 'axios'
import redis from 'async-redis'

require('dotenv').config()

const app = express()
const spotifyBaseUrl = 'https://api.spotify.com/v1/'

app.use(express.json())

// Redis

function connectToRedis() {
  const redisClient = redis.createClient(process.env.REDIS_URL)
  redisClient.on('connect', () => {
    console.log('\n🎉 Redis client connected 🎉\n')
  })
  redisClient.on('error', err => {
    console.error(`\n🚨 Redis client could not connect: ${err} 🚨\n`)
  })
  return redisClient
}

function storageArgs(key, props) {
  const { expires, body, value } = props

  const val = Boolean(body) ? JSON.stringify(body) : value
  return [
    Boolean(val) ? 'set' : 'get',
    key,
    val,
    Boolean(expires) ? 'EX' : null,
    expires
  ].filter(arg => Boolean(arg))
}

async function callStorage(method, ...args) {
  const redisClient = connectToRedis()
  const response = await redisClient[method](...args)
  redisClient.quit()
  return response
}

const getSpotifyToken = (props = {}) =>
  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: `${process.env.CLIENT_URL}/api/spotify/callback`,
      ...props
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

const getUserData = access_token =>
   axios.get(`${spotifyBaseUrl}me`, {
     headers: {
       withCredentials: true,
       Authorization: `Bearer ${access_token}`
     }
   })

// Routes

app.all('/spotify/data/:key', async ({ params: { key }, query }, res) => {
   try {
     if (key === ('refresh_token' || 'access_token'))
       throw { error: '🔒 Cannot get protected stores. 🔒' }

    const reply = await callStorage(...storageArgs(key, query))

     res.send({ [key]: reply })
   } catch (err) {
     console.error(`\n🚨 There was an error at /api/spotify/data: ${err} 🚨\n`)
     res.send(err)
   }
 })

app.get('/spotify/callback', async ({ query: { code } }, res) => {
  try {
    const { data } = await getSpotifyToken({
      code,
      grant_type: 'authorization_code'
    })
    const { access_token, refresh_token, expires_in } = data
    const {
      data: { id }
    } = await getUserData(access_token)

    if (id !== process.env.SPOTIFY_USER_ID)
      throw "🤖 You aren't the droid we're looking for. 🤖"

    callStorage(...storageArgs('is_connected', { value: true }))
    callStorage(...storageArgs('refresh_token', { value: refresh_token }))
    callStorage(
      ...storageArgs('access_token', {
        value: access_token,
        expires: expires_in
      })
    )

    const success = '🎉 Welcome Back 🎉'
    res.redirect(`/auth?success=${success}`)
  } catch (err) {
    console.error(
      `\n🚨 There was an error at /api/spotify/callback: ${err} 🚨\n`
    )
    res.redirect(`/auth?message=${err}`)
  }
})

module.exports = {
	path: '/api/',
	handler: app
}