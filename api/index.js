import express from 'express'
import redis from 'async-redis'

require('dotenv').config()

const app = express()
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

// Express app
 app.all('/spotify/data/:key', async ({ params: { key }, query }, res) => {
   try {
     if (key === ('refresh_token' || 'access_token'))
       throw { error: '🔒 Cannot get protected stores. 🔒' }

   // console.log(query, storageArgs(key, query))

    const reply = await callStorage(...storageArgs(key, query))

     res.send({ [key]: reply })
   } catch (err) {
     console.error(`\n🚨 There was an error at /api/spotify/data: ${err} 🚨\n`)
     res.send(err)
   }
 })

module.exports = {
	path: '/api/',
	handler: app
}