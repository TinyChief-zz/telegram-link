var express = require('express')
var app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const TeleBot = require('telebot')
const token = require('./config').token

const EventEmitter = require('events')
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

app.use(bodyParser.json())

app.use(cors())

var port = Number(process.env.PORT || 8810)
var server = app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})

var nsp
// 295855583
app.post('/chats', (req, res, next) => {
  const chatID = req.body.id
  
  // Init namespace
  if (chatList[chatID]) {
    res.send({ inList: true, links: chatList[chatID] })
  } else {
    res.send({ inList: false })
  }

  nsp = io.of(`chats/${chatID}`)

  nsp.once('connection', function (socket) {
    console.log(`someone connected to chats/${chatID}`)
    socket.emit('hi', { msg: 'hi!', id: chatID })

    // Fires when new link provided & 
    // sends it to client
    function sendLink (link, id) {
      if (id == chatID) {
        console.log(link)
        socket.emit('link', {link})
      }
    }
    myEmitter.on(`newLink`, sendLink)

    socket.on('disconnectMe', (data) => {
      console.log('Someone wants to disconnect')
      socket.disconnect(true)
    })
  })
  next()
})

const chatList = {
  123: ['http://google.com']
}

var io = require('socket.io').listen(server)

const bot = new TeleBot({
  token, // Required. Telegram Bot API token.
  polling: {
    // Optional. Use polling.
    interval: 1000, // Optional. How often check updates (in ms).
    timeout: 0, // Optional. Update polling timeout (0 - short polling).
    limit: 100, // Optional. Limits the number of updates to be retrieved.
    retryTimeout: 5000 // Optional. Reconnecting timeout (in ms).
    // proxy: 'http://localhost:8080'
  },
  allowedUpdates: [], // Optional. List the types of updates you want your bot to receive. Specify an empty list to receive all updates.
  usePlugins: ['askUser'], // Optional. Use user plugins from pluginFolder.
  pluginFolder: '../plugins/', // Optional. Plugin folder location.
})

bot.on('*', msg => {
  url = getURL(msg.text)
  if (url) {
    if (!chatList[msg.chat.id]) {
      chatList[msg.chat.id] = []
    }
    chatList[msg.chat.id].push(url[0])

    myEmitter.emit(`newLink`, url[0], msg.chat.id)
    msg.reply.text(`Сообщение со ссылкой. \n ${url[0]}`)
  } else {
    msg.reply.text('Ссылка не найдена.')
  }
})

// Shows chat ID on /id command
bot.on(['/id'], (msg) => msg.reply.text(`ID for this chat: ${msg.chat.id}`));

bot.on(['/start'], msg => msg.reply.text(`ID for this chat: ${msg.chat.id}`))

bot.start()

function getURL (text) {
  url = text.match(/(https?|ftp):\/\/[^\s/$.?#].[^\s]+/g)
  return url
}
