const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { NFC, KEY_TYPE_A } = require('nfc-pcsc');

let mainWindow;
let addWindow;
let connectedReaders = [];
let piccReader = {};
let connectedCard = '';

const key = 'FFFFFFFFFFFF'; // key must be a 12-chars HEX string, an instance of Buffer, or array of bytes
const keyType = KEY_TYPE_A;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  mainWindow.loadFile(`${__dirname}/index.html`);
  // mainWindow.loadURL(`https://multifamily-admin-dev.h2ohospitality.io`);
  mainWindow.on('close', () => app.quit());
  // const mainMenu = Menu.buildFromTemplate(menuTemplate);
  // Menu.setApplicationMenu(mainMenu);
});

const menuTemplate = [
  {
    label: '카드',
    submenu: [
      {
        label: '발급하기',
        click() {
          createAddWindow();
        }
      },
      {
        label: '종료',
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+Q';
          } else {
            return 'Ctrl+Q';
          }
        })(),
        click() {
          app.quit();
        }
      }
    ]
  }
];

// 연결된 리더기 목록 조회
ipcMain.on('reader:get_status', (event) => {
  console.log('reader:status received');
  let deviceNames = [];
  if (connectedReaders.length > 0) {
    deviceNames = connectedReaders.map(reader => reader.name);
  }
  mainWindow.webContents.send('reader:status', deviceNames);
});

// 연결된 카드 정보 조회
ipcMain.on('card:get_status', (event) => {
  console.log('card:status received');
  if (connectedCard) {
    mainWindow.webContents.send('card:status', connectedCard.uid);
    console.log(`card:status sent ${connectedCard.uid}`);
  }
});

// 카드 섹션 데이터 조회
// 1. 인증하기
// 2. 시작, 종료 블럭 검색
// 3. 반복구문으로 데이터 가져오기
ipcMain.on('card:get_section_data', async (event, { sectionNumber, authKey }) => {
  console.log('card:get_section_data received', sectionNumber);
  const start = +sectionNumber * 4;
  
  const sectionData = {};
  let results = [];
  for (let i=start; i<start+4; i++) {
    try {
      await piccReader.authenticate(i, keyType, authKey);
    } catch (err) {
      console.log(`인증 중 에러 발생 section: ${sectionNumber}`, piccReader, err);
      return;
    }
    // Note: writing might require to authenticate with a different key (based on the sector access conditions)
    console.log(`sector ${sectionNumber} successfully authenticated`);
    try {
			const data = await piccReader.read(i, 16, 16); // blockSize=16 must specified for MIFARE Classic cards
      results.push(data.toString('hex'));
    } catch (err) {
      console.log(`읽기 중에 에러 발생 block number: ${i}`, piccReader, err);
      return;
    }

  }
  sectionData[sectionNumber] = results;
  mainWindow.webContents.send('card:section_data', sectionData);
});

// 카드 섹션 전체 데이터 조회
// 1. 인증하기
// 2. 시작, 종료 블럭 검색
// 3. 반복구문으로 데이터 가져오기
ipcMain.on('card:get_section_data_all', async event => {
  console.log('card:get_section_data_all received');
  
  
  const sectionData = {};
  let results = [];
  for (let section=0; section<32; section++) {
    const start = section * 4;
    for (let i=start; i<start+4; i++) {
      try {
        await piccReader.authenticate(i, keyType, key);
      } catch (err) {
        console.log(`인증 중 에러 발생 section: ${section}`, err);
        return;
      }
      // Note: writing might require to authenticate with a different key (based on the sector access conditions)
      console.log(`sector ${section} successfully authenticated`);
      try {
        const data = await piccReader.read(i, 16, 16); // blockSize=16 must specified for MIFARE Classic cards
        results.push(data.toString('hex'));
      } catch (err) {
        console.log(`읽기 중에 에러 발생 block number: ${i}`, piccReader, err);
        return;
      }
    }
    sectionData[section] = results;
  }
  mainWindow.webContents.send('card:section_data_all', sectionData);
});

const nfc = new NFC();

// 카드 리더기 연결됨
nfc.on('reader', reader => {
  console.log(`NFC (${reader.reader.name}): 리더기 연결됨`);
  if (!connectedReaders.includes(reader)) {
    connectedReaders.push(reader);
    // PICC 리더를 기준으로 구현하기 때문에 이것만 관심 있음
    if (reader.reader.name.includes('PICC')) {
      piccReader = reader;
    }
  }
  if (mainWindow) {
    console.log(`reader:connected sent ${reader.name}`);
    mainWindow.webContents.send('reader:connected', reader.name);
  }

  // 카드 연결됨
  reader.on('card', card => {
    if (mainWindow) {
      connectedCard = card;
      mainWindow.webContents.send('card:connected', card.uid);
      console.log(`card:connected sent ${card.uid}`);
    }
    console.log(`NFC (${reader.reader.name}): 카드 인식됨 uid: ${card.uid}`);
  });

  // 카드 연결 해제
  reader.on('card.off', card => {
    if (mainWindow) {
      connectedCard = null;
      mainWindow.webContents.send('card:disconnected', card.uid);
      console.log(`card:disconnected sent ${card.uid}`);
    }
    console.log(`${reader.reader.name} 카드 연결해제됨 uid ${card.uid}`);
  });

  reader.on('error', err => {
    console.log(`NFC (${reader.reader.name}): an error occurred`, err);
  });

  // 리더기 연결해제
  reader.on('end', () => {
    console.log(`NFC (${reader.reader.name}): 리더기 연결해제됨`);
    connectedReaders = connectedReaders.filter(reader => reader !== reader);
    console.log("접속단말 개수", connectedReaders.length);
    mainWindow.webContents.send('reader:disconnected', reader.name);
  });
});
nfc.on('error', err => {
  console.log('NFC: an error occurred', err);
});



// function createAddWindow() {
//   addWindow = new BrowserWindow({
//     width: 1600,
//     height: 900,
//     title: '카드발급',
//     autoHideMenuBar: true,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       enableRemoteModule: false,
//       preload: path.join(__dirname, "preload.js")
//     }
//   });
  
//   addWindow.loadFile(`${__dirname}/index.html`);
//   addWindow.webContents.openDevTools();
// }

// if (process.platform === 'darwin') {
//   menuTemplate.unshift({});
// }
