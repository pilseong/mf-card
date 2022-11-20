(() => {
  const {ipcRenderer} = require('electron')
  ipcRenderer.on('attach-device', (sender, message) => {
    const messageSpan = document.getElementById('message')
    messageSpan.innerText = message.message
  })
  ipcRenderer.on('remove-device', (sender, message) => {
    const messageSpan = document.getElementById('message')
    messageSpan.innerText = message.message
  })
  ipcRenderer.on('card', (sender, message) => {
    const messageSpan = document.getElementById('message')
    const cardSpan = document.getElementById('card')
    messageSpan.innerText = message.message
    cardSpan.innerText = message.card.uid
  })
})()