const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    //whiltelist channels
    let validChannels = [
      "reader:get_status",
      "card:get_status",
      "card:get_section_data",
      "card:get_section_data_all"
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
      // console.log('reader:get_status sent');
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "reader:connected",
      "reader:status",
      "reader:disconnected",
      "card:connected",
      "card:status",
      "card:disconnected",
      "card:section_data",
      "card:section_data_all"
    ];
    if (validChannels.includes(channel)) {
      // console.log(`${channel} is registered`);
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    }
  }
});
