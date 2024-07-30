/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  session,
  Menu,
  MenuItemConstructorOptions
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
import icon from '../../resources/icon.png?asset';
import Store from '../preload/store';

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
  blocker.enableBlockingInSession(session.defaultSession);
});

Menu.setApplicationMenu(null);

const settingsStore = new Store({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 900, height: 670 },
    position: { x: 0, y: 0 }
  }
});

const historyStore = new Store({
  configName: 'history',
  defaults: {
    sites: [],
    timestamps: [],
    titles: []
  }
});

function createWindow(x: number, y: number, width: number, height: number): void {
  const mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    icon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  });

  mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.session.on('will-download', (_event, item, _webContents) => {
    const savePath = app.getPath('downloads') + '\\' + item.getFilename();
    const receivedBytes = item.getReceivedBytes();
    const totalBytes = item.getTotalBytes();

    // Set the save path, making Electron not to prompt a save dialog.
    item.setSavePath(savePath);

    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed');
      } else if (state === 'progressing') {
        const partDone = receivedBytes / totalBytes;
        if (item.isPaused()) {
          console.log('Download is paused');
        } else {
          mainWindow.webContents.send('download-progress', [receivedBytes, totalBytes, partDone]);
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    });
    item.once('done', (_event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle('Cobalt');
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        ...details.responseHeaders
      }
    });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('unmaximized');
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximized');
  });

  mainWindow.webContents.on('did-stop-loading', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send('maximized');
    } else {
      mainWindow.webContents.send('unmaximized');
    }
  });

  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    settingsStore.set('windowBounds', { width, height });
  });

  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition();
    settingsStore.set('position', { x, y });
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  ipcMain.on('TITLE_BAR_ACTION', (_event, args: string) => {
    handleTitleBarActions(mainWindow, args);
  });

  ipcMain.setMaxListeners(0);

  const MAX_HISTORY_ENTRIES = 1000;
  const TIME_THRESHOLD = 20000;

  function trimHistory(): void {
    const sites = historyStore.get('sites') as string[];
    const timestamps = historyStore.get('timestamps') as number[];
    const titles = historyStore.get('titles') as string[];

    if (sites.length > MAX_HISTORY_ENTRIES) {
      const trimmedSites = sites.slice(0, MAX_HISTORY_ENTRIES);
      const trimmedTimestamps = timestamps.slice(0, MAX_HISTORY_ENTRIES);
      const trimmedTitles = titles.slice(0, MAX_HISTORY_ENTRIES);
      historyStore.set('sites', trimmedSites);
      historyStore.set('timestamps', trimmedTimestamps);
      historyStore.set('titles', trimmedTitles);
    }
  }

  ipcMain.on(
    'UPDATE_HISTORY',
    (_event, args: { site: string; timestamp: number; title: string }) => {
      const sites = historyStore.get('sites') as string[];
      const timestamps = historyStore.get('timestamps') as number[];
      const titles = historyStore.get('titles') as string[];

      const existingIndex = sites.findIndex(
        (site, index) => site === args.site && args.timestamp - timestamps[index] < TIME_THRESHOLD
      );

      if (existingIndex === -1) {
        sites.unshift(args.site);
        timestamps.unshift(args.timestamp);
        titles.unshift(args.title);
      } else {
        sites.splice(existingIndex, 1);
        timestamps.splice(existingIndex, 1);
        titles.splice(existingIndex, 1);
        sites.unshift(args.site);
        timestamps.unshift(args.timestamp);
        titles.unshift(args.title);
      }

      historyStore.set('sites', sites.slice(0, MAX_HISTORY_ENTRIES));
      historyStore.set('timestamps', timestamps.slice(0, MAX_HISTORY_ENTRIES));
      historyStore.set('titles', titles.slice(0, MAX_HISTORY_ENTRIES));

      trimHistory();
    }
  );

  ipcMain.handle('CLEAR_HISTORY', () => {
    try {
      historyStore.clearAll();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('GET_HISTORY', () => {
    const sites = historyStore.get('sites') as string[];
    const timestamps = historyStore.get('timestamps') as number[];
    const titles = historyStore.get('titles') as number[];

    return {
      sites: sites,
      timestamps: timestamps,
      titles: titles
    };
  });

  globalShortcut.register('CmdOrCtrl+Shift+I', () => {
    mainWindow.webContents.send('toggle-webview-devtools');
    return false;
  });

  globalShortcut.register('CmdOrCtrl+R', () => {
    mainWindow.webContents.send('reload-webview');
    return false;
  });

  globalShortcut.register('CmdOrCtrl+T', () => {
    console.log('new-tab');
    mainWindow.webContents.send('new-tab');
    return false;
  });

  globalShortcut.register('CmdOrCtrl+Shift+T', () => {
    console.log('CtrlShiftT');
    mainWindow.webContents.send('open-last-tab');
    return false;
  });

  globalShortcut.register('CmdOrCtrl+H', () => {
    mainWindow.webContents.send('new-history-tab');
    return false;
  });

  globalShortcut.register('CmdOrCtrl+W', () => {
    mainWindow.webContents.send('close-active-tab');
    return false;
  });
  globalShortcut.register('CmdOrCtrl+Q', () => {
    console.log('Close tab');
    mainWindow.webContents.send('close-active-tab');
    return false;
  });
  for (let i = 0; i < 10; i++) {
    globalShortcut.register(`CmdOrCtrl+${i}`, () => {
      console.log(`Go to tab ${i}`);
      mainWindow.webContents.send(`go-to-tab-${i}`);
      return false;
    });
  }

  ipcMain.on('download', (_event, { payload }) => {
    mainWindow.webContents.downloadURL(payload.url);
  });

  ipcMain.on('show-context-menu', (event, params) => {
    const menuTemplate: MenuItemConstructorOptions[] = [];

    if (params.linkURL) {
      menuTemplate.push(
        {
          label: 'Open Link in New Tab',
          click: () =>
            event.sender.send('context-menu-command', 'open-link-new-tab', params.linkURL)
        },
        {
          label: 'Copy Link Address',
          click: () => event.sender.send('context-menu-command', 'copy-link', params.linkURL)
        }
      );
    }

    if (params.mediaType === 'image') {
      menuTemplate.push(
        {
          label: 'Save Image',
          click: () => event.sender.send('context-menu-command', 'save-image', params.srcURL)
        },
        {
          label: 'Copy Image',
          click: () => event.sender.send('context-menu-command', 'copy-image', params.srcURL)
        }
      );
    }

    if (params.isEditable) {
      menuTemplate.push(
        { label: 'Undo', click: () => event.sender.send('context-menu-command', 'undo') },
        { label: 'Redo', click: () => event.sender.send('context-menu-command', 'redo') },
        { type: 'separator' },
        { label: 'Cut', click: () => event.sender.send('context-menu-command', 'cut') },
        { label: 'Copy', click: () => event.sender.send('context-menu-command', 'copy') },
        { label: 'Paste', click: () => event.sender.send('context-menu-command', 'paste') }
      );
    }

    if (params.selectionText) {
      menuTemplate.push(
        { label: 'Copy', click: () => event.sender.send('context-menu-command', 'copy') },
        {
          label: 'Search Google for...',
          click: () => event.sender.send('context-menu-command', 'search', params.selectionText)
        }
      );
    }

    // Always add these options
    menuTemplate.push(
      { type: 'separator' },
      { label: 'Back', click: () => event.sender.send('context-menu-command', 'back') },
      { label: 'Forward', click: () => event.sender.send('context-menu-command', 'forward') },
      { label: 'Reload', click: () => event.sender.send('context-menu-command', 'reload') },
      { label: 'Inspect', click: () => event.sender.send('context-menu-command', 'inspect') }
    );

    const menu = Menu.buildFromTemplate(menuTemplate);
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      const bounds = window.getBounds();
      const x = Math.min(params.x, bounds.width);
      const y = Math.min(params.y, bounds.height);
      menu.popup({ window, x, y });
      menu.popup({ window, x, y });
    }
  });
}

function handleTitleBarActions(windowObj: BrowserWindow, args: string): void {
  if (args === 'MAXIMIZE_WINDOW') {
    windowObj.maximize();
  } else if (args === 'RESTORE_WINDOW') {
    windowObj.unmaximize();
  } else if (args === 'MINIMIZE_WINDOW') {
    windowObj.minimize();
  } else if (args === 'CLOSE_APP') {
    app.quit();
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.cobalt');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const { width, height } = settingsStore.get('windowBounds') as { width: number; height: number };
  const { x, y } = settingsStore.get('position') as { x: number; y: number };
  createWindow(x, y, width, height);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(x, y, width, height);
    }
  });

  app.on('browser-window-blur', () => {
    globalShortcut.unregisterAll();
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["connect-src 'self' https://api.allorigins.win"]
      }
    });
  });
});
