import express from 'express'
import redis from 'async-redis'

require('dotenv').config()

const app = express()

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

app.all('/spotify/data/:key', (req, res) => {
	res.send('Success! 🎉\n')
})

module.exports = {
	path: '/api/',
	handler: app
}