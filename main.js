const electron = require('electron')
const url = require('url')
const path = require('path')

// Add persistent list
const Store = require('electron-store')
const store = new Store()

const { app, BrowserWindow, Menu, ipcMain } = electron

process.env.NODE_ENV = 'production'

let mainWindow
let addWindow

// listen for app to be ready
app.on('ready', function () {
  // create new window here
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // load the HTML file into the window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }))
  // Quit application
  mainWindow.on('closed', function () {
    app.quit()
  })
  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
  // insert menu
  Menu.setApplicationMenu(mainMenu)
  // Now load any stored content via doInitialLoad function
  mainWindow.webContents.on('dom-ready', doInitialLoad)
})

// handle createAddWindow
// Note that the webPreferences section
// is what allows us to access node/electron
// things from inside the new window
function createAddWindow () {
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: 'Add To Do Item',
    webPreferences: {
      nodeIntegration: true
    }
  })
  // load the HTML file into the window
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol: 'file:',
    slashes: true
  }))
  // When the window is closed we need to set it to null
  // Garbage collection stuff
  addWindow.on('close', function () {
    addWindow = null
  })
}

// catch item:add
ipcMain.on('item:add', function (e, item) {
  let curItems = store.get('allItems')
  let newItems = [item]
  store.set('allItems', newItems.concat(curItems))
  mainWindow.webContents.send('item:add', store.get('allItems'))
  addWindow.close()
})

// catch item:setall
ipcMain.on('item:setall', function (e, item) {
  store.set('allItems', item)
})

// Initial load function
function doInitialLoad () {
  let curItems = store.get('allItems')
  mainWindow.webContents.send('item:add', curItems)
}

// create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Add Item',
        accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
        click () {
          createAddWindow()
        }
      },
      {
        label: 'Clear Items',
        accelerator: process.platform === 'darwin' ? 'Command+X' : 'Ctrl+X',
        click () {
          mainWindow.webContents.send('item:clear')
          store.set('allItems', [])
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click () {
          app.quit()
        }
      }
    ]
  }
]

// if mac add an empty object to menu
if (process.platform === 'darwin') {
  // https://github.com/bradtraversy/electronshoppinglist/issues/6
  mainMenuTemplate.unshift({ label: app.name })
}

if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle Devtools',
        accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
        click (item, focusedWindow) {
          focusedWindow.toggleDevTools()
        }
      },
      {
        role: 'reload'
      }
    ]
  })
}
