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
import { basename, extname, join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
import icon from '../../resources/icon.png?asset';
import Store from '../preload/store';
import { existsSync } from 'fs';

const blocker = ElectronBlocker.fromPrebuiltAdsOnly(fetch);

interface Download extends Partial<Electron.DownloadItem> {
	id: number;
	filename: string;
	url: string;
	state: string;
	receivedBytes: number;
	totalBytes: number;
	savePath: string;
}

Menu.setApplicationMenu(null);

const settingsStore = new Store({
	configName: 'user-preferences',
	defaults: {
		windowBounds: { width: 900, height: 670 },
		position: { x: 0, y: 0 },
		fullscreen: false,
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
					accentColor: '#98c379',
					lighterAccentColor: '#b6e197',
					disabledColor: '#5c6370',
					backgroundColor: '#282c34',
					scrollbarTrackColor: '#23272d',
					scrollbarTrackPieceColor: '#23272d',
					tabBackgroundColor: '#1e2228',
					tabHoverColor: '#323842',
					pageBtnHoverColor: '#2c313a',
					activeTabColor: '#1f252f',
					searchBarBackground: '#21252b',
					settingsMenuBackground: '#191c21',
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
					lighterAccentColor: '#8daef6',
					disabledColor: '#565f89',
					backgroundColor: '#1a1b26',
					scrollbarTrackColor: '#16161e',
					scrollbarTrackPieceColor: '#101014',
					tabBackgroundColor: '#16161e',
					tabHoverColor: '#1f2335',
					pageBtnHoverColor: '#1f2335',
					activeTabColor: '#3b4261',
					searchBarBackground: '#111115',
					settingsMenuBackground: '#16161e',
					settingsMenuHoverBackground: '#1f2335',
					historyLinkColor: '#8daef6',
					historyTimestampColor: '#565f89'
				}
			}
		]
	}
});

const downloadsStore = new Store({
	configName: 'downloads',
	defaults: {
		downloads: []
	}
});

function createWindow(
	x: number,
	y: number,
	width: number,
	height: number,
	fullscreen: boolean
): void {
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

	if (fullscreen) {
		mainWindow.maximize();
		mainWindow.webContents.send('maximized');
	} else {
		mainWindow.minimize();
		mainWindow.webContents.send('unmaximized');
	}

	mainWindow.setMenu(null);
	mainWindow.webContents.openDevTools();

	mainWindow.webContents.session.on('will-download', (_event, item, _webContents) => {
		const getUniqueFilePath = (basePath, fileName): string => {
			let newPath = join(basePath, fileName);
			let counter = 1;
			const ext = extname(fileName);
			const nameWithoutExt = basename(fileName, ext);

			while (existsSync(newPath)) {
				newPath = join(basePath, `${nameWithoutExt} (${counter})${ext}`);
				counter++;
			}

			return newPath;
		};

		const baseSavePath = app.getPath('downloads');
		const originalFilename = item.getFilename();
		const uniqueSavePath = getUniqueFilePath(baseSavePath, originalFilename);
		const uniqueFilename = basename(uniqueSavePath);

		const downloadItem = {
			id: Date.now(),
			filename: uniqueFilename,
			url: item.getURL(),
			state: 'started',
			receivedBytes: 0,
			totalBytes: item.getTotalBytes() === 0 ? item.getReceivedBytes() : item.getTotalBytes(),
			savePath: uniqueSavePath
		};
		// Add to downloads store
		const downloads = downloadsStore.get('downloads') as unknown[];
		downloads.unshift(downloadItem);
		downloadsStore.set('downloads', downloads);

		// Send to frontend
		mainWindow.webContents.send('download-started', downloadItem);

		item.setSavePath(downloadItem.savePath);

		item.on('updated', (_event, state) => {
			const updatedItem = {
				...downloadItem,
				state: state,
				receivedBytes: item.getReceivedBytes(),
				totalBytes: item.getTotalBytes()
			};

			// Update store
			const downloads = downloadsStore.get('downloads') as Download[];
			const index = downloads.findIndex((d) => d.id === downloadItem.id);
			if (index !== -1) {
				downloads[index] = updatedItem;
				downloadsStore.set('downloads', downloads);
			}

			// Send to frontend
			mainWindow.webContents.send('download-updated', updatedItem);
		});

		ipcMain.on('CANCEL_DOWNLOAD', (_event, downloadId) => {
			const downloads = downloadsStore.get('downloads') as Download[];
			const index = downloads.findIndex((d) => d.id === downloadId);
			if (index !== -1) {
				const downloadItem = item.getURL() === downloads[index].url ? item : null;
				if (downloadItem && downloadItem.getState() !== 'cancelled') {
					// Update the download item in the store
					downloadItem.cancel();
					downloads[index].state = 'cancelled';
					downloadsStore.set('downloads', downloads);
					// Send the updated download item to the renderer process
					mainWindow.webContents.send('download-updated', downloads[index]);
				}
			}
		});

		ipcMain.on('PAUSE_DOWNLOAD', (_event, downloadId) => {
			const downloads = downloadsStore.get('downloads') as Download[];
			const index = downloads.findIndex((d) => d.id === downloadId);
			if (index !== -1) {
				const downloadItem = item.getURL() === downloads[index].url ? item : null;
				if (downloadItem && downloadItem.getState() === 'progressing') {
					// Update the download item in the store
					downloadItem.pause();
					downloads[index].state = 'interrupted';
					downloadsStore.set('downloads', downloads);
					// Send the updated download item to the renderer process
					mainWindow.webContents.send('download-updated', downloads[index]);
				}
			}
		});

		ipcMain.on('RESUME_DOWNLOAD', (_event, downloadId) => {
			const downloads = downloadsStore.get('downloads') as Download[];
			const index = downloads.findIndex((d) => d.id === downloadId);
			if (index !== -1) {
				const downloadItem = item.getURL() === downloads[index].url ? item : null;
				if (downloadItem && downloadItem.isPaused()) {
					// Update the download item in the store
					downloadItem.resume();
					downloads[index].state = 'progressing';
					downloadsStore.set('downloads', downloads);
					// Send the updated download item to the renderer process
					mainWindow.webContents.send('download-updated', downloads[index]);
				}
			}
		});

		item.once('done', (_event, state) => {
			const finalItem = {
				...downloadItem,
				state: state,
				receivedBytes: item.getReceivedBytes(),
				totalBytes: item.getTotalBytes()
			};

			// Update store
			const downloads = downloadsStore.get('downloads') as Download[];
			const index = downloads.findIndex((d) => d.id === downloadItem.id);
			if (index !== -1) {
				downloads[index] = finalItem;
				downloadsStore.set('downloads', downloads);
			}

			// Send to frontend
			mainWindow.webContents.send('download-completed', finalItem);
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
		settingsStore.set('fullscreen', false);
	});

	mainWindow.on('maximize', () => {
		mainWindow.webContents.send('maximized');
		settingsStore.set('fullscreen', true);
	});

	mainWindow.on('enter-full-screen', () => {
		mainWindow.webContents.send('maximized');
		settingsStore.set('fullscreen', true);
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

	ipcMain.handle('GET_DOWNLOADS', () => {
		return downloadsStore.get('downloads');
	});

	ipcMain.handle('OPEN_FOLDER', (_event, folderPath) => {
		shell.openPath(folderPath);
	});

	ipcMain.on('UPDATE_ADBLOCKER', async (_event, args: { status: boolean }) => {
		try {
			// Send initial loading state
			mainWindow.webContents.send('ADBLOCKER_LOADING', true);

			// Load the blocker
			mainWindow.webContents.send('ADBLOCKER_LOADING_STATUS', 'Loading blocker...');

			// Enable blocking in session
			mainWindow.webContents.send(
				'ADBLOCKER_LOADING_STATUS',
				'Enabling blocking in session...'
			);
			const instance = (await blocker).enableBlockingInSession(session.defaultSession);

			// Enable or disable based on args
			if (args.status === true) {
				mainWindow.webContents.send('ADBLOCKER_LOADING_STATUS', 'Enabling adblocker...');
				instance.enable();
			} else {
				mainWindow.webContents.send('ADBLOCKER_LOADING_STATUS', 'Disabling adblocker...');
				instance.disable();
			}

			// Send completion message
			mainWindow.webContents.send('ADBLOCKER_STATUS', 'Adblocker update complete');
			mainWindow.webContents.send('ADBLOCKER_LOADING', false);

			// Reload webview
			mainWindow.webContents.send('reload-webview');
		} catch (error) {
			console.error('Error updating adblocker:', error);
			mainWindow.webContents.send('ADBLOCKER_LOADING', false);
			mainWindow.webContents.send('ADBLOCKER_STATUS', 'Error updating adblocker');
		}
	});

	ipcMain.on('CLEAR_DOWNLOADS', () => {
		downloadsStore.set('downloads', []);
		mainWindow.webContents.send('downloads-cleared');
	});

	ipcMain.on('REMOVE_DOWNLOAD', (event, downloadId) => {
		const downloads = downloadsStore.get('downloads') as Download[];
		const updatedDownloads = downloads.filter((d) => d.id !== downloadId);
		downloadsStore.set('downloads', updatedDownloads);
		event.reply('download-removed', downloadId);
	});

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

	ipcMain.on('REMOVE_HISTORY_ITEM', (_event, site) => {
		const sites = historyStore.get('sites') as string[];
		const timestamps = historyStore.get('timestamps') as number[];
		const titles = historyStore.get('titles') as string[];

		const siteIndex = sites.findIndex((s) => s === site);
		if (siteIndex !== -1) {
			const filteredSites = sites.filter((_, index) => index !== siteIndex);
			const filteredTimestamps = timestamps.filter((_, index) => index !== siteIndex);
			const filteredTitles = titles.filter((_, index) => index !== siteIndex);

			historyStore.set('sites', filteredSites);
			historyStore.set('timestamps', filteredTimestamps);
			historyStore.set('titles', filteredTitles);
		}
	});

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
		globalShortcut.register('CmdOrCtrl+J', () => {
			mainWindow.webContents.send('open-downloads-page');
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

		globalShortcut.register('CmdOrCtrl+Y', () => {
			mainWindow.webContents.send('open-themes-page');
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
		globalShortcut.register('CmdOrCtrl+F', () => {
			mainWindow.webContents.send('find');
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
	const fullscreen = settingsStore.get('fullscreen') as boolean;
	const { x, y } = settingsStore.get('position') as { x: number; y: number };
	electronApp.setAppUserModelId('com.cobalt');

	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	createWindow(x, y, width, height, fullscreen);

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow(x, y, width, height, fullscreen);
		}
	});

	app.on('browser-window-blur', () => {
		globalShortcut.unregisterAll();
	});

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [
					`default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
					script-src * 'unsafe-inline' 'unsafe-eval';
					connect-src * 'unsafe-inline' data:;
					img-src * data: blob: 'unsafe-inline';
					frame-src *;
					style-src * 'unsafe-inline';`
				]
			}
		});
	});
});
