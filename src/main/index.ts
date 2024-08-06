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
		position: { x: 0, y: 0 },
		activeTheme: 'Catppuccin'
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

const themeStore = new Store({
	configName: 'themes',
	defaults: {
		themes: [
			{
				name: 'Catppuccin',
				colors: {
					textColor: '#cdd6f4',
					accentColor: '#b4befe',
					lighterAccentColor: '#c0c7f0',
					disabledColor: '#4f577f',
					backgroundColor: '#1e1e2e',
					scrollbarTrackColor: 'rgb(32, 40, 48)',
					scrollbarTrackPieceColor: 'rgb(18, 22, 26)',
					tabBackgroundColor: '#313244',
					tabHoverColor: '#7f849c',
					pageBtnHoverColor: '#1e1e1e',
					activeTabColor: '#6c7086',
					searchBarBackground: '#181825',
					settingsMenuBackground: '#1e1e2e',
					settingsMenuHoverBackground: '#313244',
					historyLinkColor: '#89b4fa',
					historyTimestampColor: '#6c7086'
				}
			},
			{
				name: 'One Dark Pro',
				colors: {
					textColor: '#abb2bf',
					accentColor: '#61afef',
					lighterAccentColor: '#56b6c2',
					disabledColor: '#5c6370',
					backgroundColor: '#282c34',
					scrollbarTrackColor: '#21252b',
					scrollbarTrackPieceColor: '#1e2227',
					tabBackgroundColor: '#21252b',
					tabHoverColor: '#323842',
					pageBtnHoverColor: '#2c313a',
					activeTabColor: '#3a3f4b',
					searchBarBackground: '#21252b',
					settingsMenuBackground: '#282c34',
					settingsMenuHoverBackground: '#2c313a',
					historyLinkColor: '#98c379',
					historyTimestampColor: '#5c6370'
				}
			},
			{
				name: 'Github Dark',
				colors: {
					textColor: '#c9d1d9',
					accentColor: '#58a6ff',
					lighterAccentColor: '#79c0ff',
					disabledColor: '#6e7681',
					backgroundColor: '#0d1117',
					scrollbarTrackColor: '#161b22',
					scrollbarTrackPieceColor: '#0d1117',
					tabBackgroundColor: '#161b22',
					tabHoverColor: '#1f2428',
					pageBtnHoverColor: '#1f2428',
					activeTabColor: '#1f6feb',
					searchBarBackground: '#161b22',
					settingsMenuBackground: '#161b22',
					settingsMenuHoverBackground: '#1f2428',
					historyLinkColor: '#58a6ff',
					historyTimestampColor: '#8b949e'
				}
			},
			{
				name: 'Tokyo Night',
				colors: {
					textColor: '#a9b1d6',
					accentColor: '#7aa2f7',
					lighterAccentColor: '#2ac3de',
					disabledColor: '#565f89',
					backgroundColor: '#1a1b26',
					scrollbarTrackColor: '#16161e',
					scrollbarTrackPieceColor: '#101014',
					tabBackgroundColor: '#16161e',
					tabHoverColor: '#1f2335',
					pageBtnHoverColor: '#1f2335',
					activeTabColor: '#3b4261',
					searchBarBackground: '#16161e',
					settingsMenuBackground: '#16161e',
					settingsMenuHoverBackground: '#1f2335',
					historyLinkColor: '#9ece6a',
					historyTimestampColor: '#565f89'
				}
			},
			{
				name: 'Andromeda',
				colors: {
					textColor: '#d5ced9',
					accentColor: '#23b0ff',
					lighterAccentColor: '#00e8c6',
					disabledColor: '#5f5c6d',
					backgroundColor: '#23262e',
					scrollbarTrackColor: '#1c1e26',
					scrollbarTrackPieceColor: '#181a21',
					tabBackgroundColor: '#2b2e3b',
					tabHoverColor: '#3e4251',
					pageBtnHoverColor: '#3e4251',
					activeTabColor: '#3e4251',
					searchBarBackground: '#1c1e26',
					settingsMenuBackground: '#1c1e26',
					settingsMenuHoverBackground: '#2b2e3b',
					historyLinkColor: '#ff5370',
					historyTimestampColor: '#5f5c6d'
				}
			},
			{
				name: 'Github Light',
				colors: {
					textColor: '#24292e',
					accentColor: '#0366d6',
					lighterAccentColor: '#2188ff',
					disabledColor: '#959da5',
					backgroundColor: '#ffffff',
					scrollbarTrackColor: '#f6f8fa',
					scrollbarTrackPieceColor: '#ebedf0',
					tabBackgroundColor: '#f6f8fa',
					tabHoverColor: '#e1e4e8',
					pageBtnHoverColor: '#e1e4e8',
					activeTabColor: '#0366d6',
					searchBarBackground: '#f6f8fa',
					settingsMenuBackground: '#f6f8fa',
					settingsMenuHoverBackground: '#e1e4e8',
					historyLinkColor: '#0366d6',
					historyTimestampColor: '#6a737d'
				}
			}
		]
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
			contextIsolation: false
		}
	});

	mainWindow.setMenu(null);
	// mainWindow.webContents.openDevTools();
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
					mainWindow.webContents.send('download-progress', [
						receivedBytes,
						totalBytes,
						partDone
					]);
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

	ipcMain.setMaxListeners(200000000);

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
				(site, index) =>
					site === args.site && args.timestamp - timestamps[index] < TIME_THRESHOLD
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

	ipcMain.handle('GET_ACTIVE_THEME', () => {
		const activeTheme = settingsStore.get('activeTheme');

		return activeTheme;
	});

	ipcMain.handle('GET_THEMES_AND_ACTIVE_THEME', () => {
		const activeTheme = settingsStore.get('activeTheme');
		const themes = themeStore.get('themes') as {
			name: string;
			colors: {
				[key: string]: string;
			};
		}[];

		return { themes, activeTheme };
	});

	ipcMain.handle('GET_THEMES', () => {
		const themes = themeStore.get('themes') as {
			name: string;
			colors: {
				[key: string]: string;
			};
		}[];

		return themes;
	});

	ipcMain.on('SET_ACTIVE_THEME', (_event, themeName) => {
		console.log(themeName);
		try {
			settingsStore.set('activeTheme', themeName);
			return { success: true, message: 'Theme added successfully' };
		} catch (err) {
			return { success: false, message: err };
		}
	});

	ipcMain.on(
		'ADD_THEME',
		(_event, newTheme: { name: string; colors: { [key: string]: string } }) => {
			try {
				const themes = themeStore.get('themes') as {
					name: string;
					colors: {
						[key: string]: string;
					};
				}[];

				// Check if a theme with the same name already exists
				const existingThemeIndex = themes.findIndex(
					(theme) => theme.name === newTheme.name
				);

				if (existingThemeIndex !== -1) {
					// If the theme exists, update it
					themes[existingThemeIndex] = newTheme;
				} else {
					// If the theme doesn't exist, add it
					themes.push(newTheme);
				}

				// Save the updated themes array
				themeStore.set('themes', themes);

				return { success: true, message: 'Theme added successfully' };
			} catch (error) {
				console.error('Error adding theme:', error);
				return { success: false, message: 'Failed to add theme' };
			}
		}
	);

	ipcMain.on('REMOVE_THEME', (_event, themeName) => {
		let themes = themeStore.get('themes') as {
			name: string;
			colors: {
				[key: string]: string;
			};
		}[];

		const existingThemeIndex = themes.findIndex((theme) => theme.name === themeName);

		if (existingThemeIndex !== -1) {
			// If the theme exists, update it
			themes = themes.filter((theme) => theme.name !== themeName);
		}

		themeStore.set('themes', themes);
		return { success: true, message: 'Theme removed successfully' };
	});

	app.on('browser-window-focus', () => {
		globalShortcut.register('CmdOrCtrl+Shift+I', () => {
			mainWindow.webContents.send('toggle-webview-devtools');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+R', () => {
			mainWindow.webContents.send('reload-webview');
			return false;
		});

		globalShortcut.register('CmdOrCtrl+T', () => {
			mainWindow.webContents.send('new-tab');
			return false;
		});

		globalShortcut.register('CmdOrCtrl+Shift+T', () => {
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
			mainWindow.webContents.send('close-active-tab');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+=', () => {
			mainWindow.webContents.send('zoom-in');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+-', () => {
			mainWindow.webContents.send('zoom-out');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+0', () => {
			mainWindow.webContents.send('reset-zoom');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+1', () => {
			mainWindow.webContents.send('go-to-tab-1');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+2', () => {
			mainWindow.webContents.send('go-to-tab-2');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+3', () => {
			mainWindow.webContents.send('go-to-tab-3');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+4', () => {
			mainWindow.webContents.send('go-to-tab-4');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+5', () => {
			mainWindow.webContents.send('go-to-tab-5');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+6', () => {
			mainWindow.webContents.send('go-to-tab-6');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+7', () => {
			mainWindow.webContents.send('go-to-tab-7');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+8', () => {
			mainWindow.webContents.send('go-to-tab-8');
			return false;
		});
		globalShortcut.register('CmdOrCtrl+9', () => {
			mainWindow.webContents.send('go-to-tab-9');
			return false;
		});
	});
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
						event.sender.send(
							'context-menu-command',
							'open-link-new-tab',
							params.linkURL
						)
				},
				{
					label: 'Copy Link Address',
					click: () =>
						event.sender.send('context-menu-command', 'copy-link', params.linkURL)
				}
			);
		}

		if (params.mediaType === 'image') {
			menuTemplate.push(
				{
					label: 'Save Image',
					click: () =>
						event.sender.send('context-menu-command', 'save-image', params.srcURL)
				},
				{
					label: 'Copy Image',
					click: () =>
						event.sender.send('context-menu-command', 'copy-image', params.srcURL)
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
					click: () =>
						event.sender.send('context-menu-command', 'search', params.selectionText)
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
	const { width, height } = settingsStore.get('windowBounds') as {
		width: number;
		height: number;
	};
	const { x, y } = settingsStore.get('position') as { x: number; y: number };
	electronApp.setAppUserModelId('com.cobalt');

	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

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
