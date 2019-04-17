import express from 'express'
import redis from 'async-redis'

require('dotenv').config()

const app = express()

app.all('/spotify/data/:key', (req, res) => {
	res.send('Success! 🎉\n')
})

module.exports = {
	path: '/api/',
	handler: app
}