const electron = require('electron');
const {
  app,
  BrowserWindow,
  ipcMain
} = electron;

process.on('uncaughtException', (error) => {
  console.log(error);
});

const path = require('path');
const url = require('url');

const shortcuts = require('./shortcuts');
const utils = require('../../shared/utils');

const DEV = true;
const DEBUG = true;
const DEBUG_RENDERER = false;

const START_COMPACT = true;

let WINDOW_FULL_WIDTH = 300;
let WINDOW_FULL_HEIGHT = 115;
let WINDOW_COMPACT_WIDTH = 150;
let WINDOW_COMPACT_HEIGHT = 63;

if (DEBUG_RENDERER) {
  WINDOW_FULL_WIDTH = 800;
  WINDOW_FULL_HEIGHT = 600;
  WINDOW_COMPACT_WIDTH = 800;
  WINDOW_COMPACT_HEIGHT = 600;
}

if (DEV) {
  require('electron-reload')([__dirname, '../../shared'], {
    electron: path.join(__dirname, '../node_modules/.bin/electron'),
    argv: ['src/main.js']
  });
}

let mainWindow;
let windowHeight = WINDOW_FULL_HEIGHT;
let windowWidth = WINDOW_FULL_WIDTH;
let tray;

if (START_COMPACT) {
  windowWidth = WINDOW_COMPACT_WIDTH;
  windowHeight = WINDOW_COMPACT_HEIGHT;
}

const createWindow = function() {
  const { screen } = electron;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: width - windowWidth,
    y: height - windowHeight,
    frame: false,
    backgroundColor: '#1a1a1a',
    resizable: false,
    // movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // on linux alwaysOnTop in constructor didn't work for me
    mainWindow.setAlwaysOnTop(true);
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  if (DEBUG_RENDERER) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function handleClose() {
    mainWindow = null;
  });
};

const toggleWindowVisibility = function () {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();

      // on linux this properties may be eventually dropped
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setSkipTaskbar(true);
    }
  } else {
    createWindow();
  }
};

const changeWindowSize = function (newWidth, newHeight) {
  const { screen } = electron;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  windowWidth = newWidth;
  windowHeight = newHeight;

  if (mainWindow) {
    mainWindow.setResizable(true);
    mainWindow.setSize(windowWidth, windowHeight);
    mainWindow.setResizable(false);
    mainWindow.setPosition(width - windowWidth, height - windowHeight);
  }
};

app.on('ready', () => {
  tray = require('./tray'); // eslint-disable-line

  tray.init(toggleWindowVisibility);

  createWindow();

  const io = require('socket.io')(); // eslint-disable-line
  let mpris;

  let clientSocket;

  const emitSocketEvent = function (event) {
    if (clientSocket) {
      clientSocket.emit(event);
    }
  };

  shortcuts.register(emitSocketEvent);

  if (process.platform === 'linux' && false) {
    mpris = require('./mpris');
    mpris.init(emitSocketEvent);
  }

  let connectedSockets = [];

  const selectNewSocket = function () {
    connectedSockets = connectedSockets.filter((socket) => socket.connected);

    if (!clientSocket) {
      clientSocket = connectedSockets[0] || null;
      configureSocket(clientSocket);
      clientSocket.emit('getStatus');
    }
  };

  const statusUpdated = function (status) {
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.send('status', status);
    });
    mainWindow.send('status', status);

    if (mpris) {
      mpris.setState(Object.assign({}, status, {
        duration: Math.floor(status.duration * 1000 * 1000)
      }));
    }

    if (status.isPlaying) {
      tray.showPlay();
    } else {
      tray.showPause();
    }
  };

  const progressUpdated = function (progress) {
    if (mpris) {
      // progress.position - seconds
      mpris.seeked(Math.floor(progress.position * 1000 * 1000));
    }

    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.send('seeked', progress);
    });

    mainWindow.send('seeked', progress);
  };

  const configureSocket = function (client) {
    if (DEBUG) {
      utils.patchForEventsDebugging(client, 'socket');
    }

    client
      .on('status', statusUpdated)
      .on('seeked', progressUpdated)
      .on('disconnect', function () {
        const index = connectedSockets.indexOf(client);

        if (~index) {
          connectedSockets.splice(index, 1);
        }

        if (clientSocket === client) {
          clientSocket = null;
          selectNewSocket();
        }
      });
  };

  io.on('connection', function (client) {
    console.log('client connected');

    if (!clientSocket) {
      clientSocket = client;
    } else {
      connectedSockets.push(client);
      return;
    }

    configureSocket(client);
  });

  io.set('origins', '*:*');

  io.listen(3007);

  if (DEBUG) {
    // utils.patchForEventsDebugging(ipcMain, 'ipcMain')
  }

  ipcMain
    .on('play', function playFromRenderer() {
      emitSocketEvent('play');
    })
    .on('pause', function pauseFromRenderer() {
      emitSocketEvent('pause');
    })
    .on('prev', function () {
      emitSocketEvent('prev');
    })
    .on('to-beginning', function () {
      emitSocketEvent('to-beginning');
    })
    .on('next', function () {
      emitSocketEvent('next');
    })
    .on('hide', function () {
      toggleWindowVisibility();
    })
    .on('switch-view', function () {
      if (windowWidth > 200) {
        changeWindowSize(WINDOW_COMPACT_WIDTH, WINDOW_COMPACT_HEIGHT);
      } else {
        changeWindowSize(WINDOW_FULL_WIDTH, WINDOW_FULL_HEIGHT);
      }
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function handleAllClosed() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    tray.destroy();

    app.quit();
  }
});

app.on('will-quit', () => {
  shortcuts.unregister();
});

app.on('activate', function handleActivate() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
