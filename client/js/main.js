const input = document.querySelector('.input-chat-id')
const btnAccept = document.querySelector('.btn-accept')
const btnChange = document.querySelector('.btn-change')
const statusList = document.querySelectorAll('.chat-status li')
// const url = 'http://localhost:8810/chats'
const url = 'https://telegram-links.herokuapp.com/chats'

const statuses = [
  'Waiting for chat ID ...',
  'Verifiyng provided chat ID ...',
  'Waiting for link ...'
]

btnAccept.addEventListener('click', () => {
  statusList[0].classList.remove('progress')
  statusList[0].classList.add('passed')
  statusList[2].classList.add('progress')
  statusList[0].innerText += `\n ––> provided ID: ${input.value}`

  input.disabled = true
  btnAccept.classList.add('btn-disabled')

  // Say to server that ID is provided
  fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: input.value })
  })
    .then(response => response.json())
    .then(data => {
      if (data.inList) {
        statusList[1].innerText += `\n ––> Chat with that ID found.`
        statusList[1].classList.remove('progress')
        statusList[1].classList.add('passed')
        statusList[2].classList.add('progress')

        console.log('Найден чат с таким ID.')
        console.log('Найденные ссылки :', data.links)
      } else {
        console.log('Нет чата с таким ID.')
      }

      // Connect to socket with namespace
      const socket = io(`${url}/${input.value}`)

      socket.on('connect', () => {
        console.log('connected to namespace')
      })

      // Ping-pong
      socket.on('hi', data => {
        console.log(data)
      })

      // Wait for new link in telegram & open it
      socket.on('link', data => {
        console.log(data)
        window.open(data.link, '_blank').focus()
      })

      // Remove socket connection when `change ID` button pressed
      function handleChange () {
        socket.emit('disconnectMe')
        this.removeEventListener('click', handleChange)
        input.disabled = false
        btnAccept.classList.remove('btn-disabled')

        statusList[0].innerText += `\n ––> provided ID: ${input.value}`

        statusList[0].classList.remove('passed')
        statusList[0].classList.add('progress')
        statusList[1].classList.remove('passed')
        statusList[2].classList.remove('progress')

        statusList.forEach((el, i) => {
          el.innerText = statuses[i]
        }) 
      }
      btnChange.addEventListener('click', handleChange)
    })
    .catch(err => {
      console.log(err)
    })
})
