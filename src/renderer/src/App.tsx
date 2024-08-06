/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import close from './assets/icons/close-w-10.png';
import restore from './assets/icons/icons8-restore-down-48.png';
import maximize from './assets/icons/max-w-10.png';
import minimize from './assets/icons/min-w-10.png';
import cobalt from './assets/icons/icon.png';
import { WebviewTag, clipboard } from 'electron';
import Webview from './components/Webview';
import Notification from './assets/Notifications/notifications.js';

interface Tab {
	name: string;
	url: string;
	id: number;
	key: string;
}

interface Theme {
	name: string;
	colors: Record<string, string>;
}

function App(): JSX.Element {
	const [idCounter, setIdCounter] = useState(1);
	const [tabs, setTabs] = useState<Tab[]>([{ name: 'New Tab', url: '', id: 0, key: `tab-0` }]);
	const [activeTab, setActiveTab] = useState<number>(0);
	const [searchInput, setSearchInput] = useState('');
	const [homeSearchInput, setHomeSearchInput] = useState('');
	const searchInputRef = useRef<HTMLInputElement>(null);
	const webviewRefs = useRef<{ [key: string]: WebviewTag }>({});
	const [canGoBack, setCanGoBack] = useState(false);
	const [canGoForward, setCanGoForward] = useState(false);
	const [history, setHistory] = useState<{
		sites: string[];
		timestamps: number[];
		titles: string[];
	}>({
		sites: [],
		timestamps: [],
		titles: []
	});
	const [titles, setTitles] = useState({});
	const [lastTab, setLastTab] = useState<Tab>();
	const [themes, setThemes] = useState<Theme[]>([
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
	]);
	const [activeTheme, setActiveTheme] = useState<Theme>(themes[0]);
	const [newThemeName, setNewThemeName] = useState('');
	const [newThemeColor, setNewThemeColor] = useState({
		textColor: '#000000',
		accentColor: '#000000',
		lighterAccentColor: '#000000',
		disabledColor: '#000000',
		backgroundColor: '#000000',
		scrollbarTrackColor: '#000000',
		scrollbarTrackPieceColor: '#000000',
		tabBackgroundColor: '#000000',
		tabHoverColor: '#000000',
		pageBtnHoverColor: '#000000',
		activeTabColor: '#000000',
		searchBarBackground: '#000000',
		settingsMenuBackground: '#000000',
		settingsMenuHoverBackground: '#000000',
		historyLinkColor: '#000000',
		historyTimestampColor: '#000000'
	});
	const [showThemeForm, setShowThemeForm] = useState(false);
	const themeFormRef = useRef<HTMLDivElement>(null);
	const themeButtonRef = useRef<HTMLButtonElement>(null);
	const [settingsVisibility, setSettingsVisibility] = useState(false);
	const settingsBtnRef = useRef<HTMLButtonElement>(null);
	const settingsMenuRef = useRef<HTMLDivElement>(null);
	const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
	const ipcRenderer = (window as any).electron.ipcRenderer;
	const popup = Notification({
		position: 'center',
		duration: 1000,
		isHidePrev: true,
		isHideTitle: false
	});

	// Tab management
	function addTab(): void {
		const newTab = { name: 'New Tab', url: '', id: idCounter, key: `tab-${idCounter}` };
		setTabs([...tabs, newTab]);
		setIdCounter(idCounter + 1);
		setActiveTab(newTab.id);
		setSearchInput('');
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}

	function openLinkInNewTab(url: string): void {
		const newTab = { name: '', id: idCounter, url: url, key: `tab-${idCounter}` };
		setTabs([...tabs, newTab]);

		// After the tab is added and the webview is created
		const webview = webviewRefs.current[newTab.id];
		if (webview) {
			webview.addEventListener('page-title-updated', (event) => {
				setTabs((prevTabs) =>
					prevTabs.map((tab) =>
						tab.id === newTab.id ? { ...tab, name: event.title } : tab
					)
				);
			});
		}
		setIdCounter(idCounter + 1);
		setActiveTab(newTab.id);
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}

	function addLastTab(): void {
		if (lastTab !== undefined) {
			const newTab = {
				name: lastTab.name,
				url: lastTab.url,
				id: idCounter,
				key: `tab-${idCounter}`
			};
			setTabs([...tabs, newTab]);
			setIdCounter(idCounter + 1);
			setActiveTab(newTab.id);
			setSearchInput('');
			if (searchInputRef.current) {
				searchInputRef.current.focus();
			}
		}
	}

	function openCobaltPageFromSettings(name: string, url: string): void {
		const cobaltTab = {
			name: name,
			url: url,
			id: idCounter,
			key: `tab-${idCounter}`
		};
		setTabs([...tabs, cobaltTab]);
		setIdCounter(idCounter + 1);
		setActiveTab(cobaltTab.id);
		setSearchInput(url);
		showSettings();
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}
	function openCobaltPage(name: string, url: string): void {
		const cobaltTab = {
			name: name,
			url: url,
			id: idCounter,
			key: `tab-${idCounter}`
		};
		setTabs([...tabs, cobaltTab]);
		setIdCounter(idCounter + 1);
		setActiveTab(cobaltTab.id);
		setSearchInput(url);
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}

	function closeTab(id: number): void {
		setTabs((prevTabs) => {
			const closingTab = tabs[getTabIndexFromId(id)];
			setLastTab(closingTab);
			const newTabs = prevTabs.filter((tab) => tab.id !== id);

			// Close the window if it's the last tab
			if (newTabs.length === 0) {
				ipcRenderer.send('TITLE_BAR_ACTION', 'CLOSE_APP');
				return prevTabs;
			}

			// If the closed tab was the active one, set a new active tab
			if (activeTab === id) {
				setSearchInput(newTabs[newTabs.length - 1].url);
				setActiveTab(newTabs[newTabs.length - 1].id);
			} else {
				setActiveTab(newTabs[getTabIndexFromId(id)].id);
			}

			return newTabs;
		});
	}

	function getTabIndexFromId(id: number): number {
		return tabs.findIndex((tab) => tab.id === id);
	}

	function setActivePage(id: number): void {
		if (id !== null) {
			setTabs((prevTabs) => {
				const tab = prevTabs.find((t) => t.id === id);
				if (tab) {
					setSearchInput(tab.url);
					setActiveTab(id);
				}
				return prevTabs;
			});
		}
	}

	// Settings

	const showSettings = (): void => {
		setSettingsVisibility(!settingsVisibility);
	};

	function settingsMenuAddTab(): void {
		const newTab = { name: 'New Tab', url: '', id: idCounter, key: `tab-${idCounter}` };
		setTabs([...tabs, newTab]);
		setIdCounter(idCounter + 1);
		setActiveTab(newTab.id);
		setSearchInput('');
		showSettings();
	}

	// History Page

	const fetchHistory = async (): Promise<void> => {
		const result = await ipcRenderer.invoke('GET_HISTORY');
		if (result) {
			setHistory(result);
		}
	};

	function addToHistory(site: string, title: string): void {
		ipcRenderer.send('UPDATE_HISTORY', {
			site: site,
			timestamp: Date.now(),
			title: title
		});
	}

	const clearHistory = async (): Promise<void> => {
		try {
			await ipcRenderer.invoke('CLEAR_HISTORY');

			// Clear local state
			setHistory({
				sites: [],
				timestamps: [],
				titles: []
			});
		} catch (error) {
			console.error('Error clearing history:', error);
		}
	};

	// Themes Page

	// const fetchActiveTheme = async (): Promise<void> => {
	// 	const result = await ipcRenderer.invoke('GET_ACTIVE_THEME');
	// 	const themeOfThis = themes.find((theme) => theme.name === result);
	// 	console.log(result, themeOfThis);
	// 	console.log(themes);
	// 	if (themeOfThis) {
	// 		setActiveTheme(themeOfThis);
	// 		applyTheme(themeOfThis);
	// 	} else if (!themeOfThis) {
	// 		setActiveTheme(themes[themes.length - 1]);
	// 	}
	// };

	const fetchThemes = async (): Promise<void> => {
		const result = await ipcRenderer.invoke('GET_THEMES');
		if (result) {
			setThemes(result);
		}
	};

	const fetchThemesAndActiveTheme = async (): Promise<void> => {
		const { themes, activeTheme } = await ipcRenderer.invoke('GET_THEMES_AND_ACTIVE_THEME');
		const themeOfThis = themes.find((theme) => theme.name === activeTheme);
		if (themes && themeOfThis) {
			setThemes(themes);
			setActiveTheme(themeOfThis);
			applyTheme(themeOfThis);
		}
	};

	const handleThemeInputChange = (e): void => {
		setNewThemeName(e.target.value);
	};

	const handleNewThemeColorChange = (e): void => {
		const { name, value } = e.target;
		setNewThemeColor({
			...newThemeColor,
			[name]: value
		});
	};

	const handleAddTheme = (e): void => {
		e.preventDefault();
		const themeNames: string[] = [];
		themes.forEach((theme) => {
			themeNames.push(theme.name);
		});
		if (newThemeName !== '') {
			if (themeNames.includes(newThemeName)) {
				popup.error({
					title: 'Error',
					message: `${newThemeName} already exists.`
				});
			} else {
				addTheme(newThemeName, newThemeColor);
				setShowThemeForm(false);
			}
		} else {
			popup.error({
				title: 'Error',
				message: `Theme must have a name.`
			});
		}
	};

	const handleRemoveTheme = (themeName: string): void => {
		if (activeTheme === themes.find((theme) => theme.name === themeName)) {
			handleSelectTheme(themes[themes.length - 2].name);
		}
		removeTheme(themeName);
	};

	function addTheme(name: string, colors: object): void {
		ipcRenderer.send('ADD_THEME', {
			name,
			colors
		});
		fetchThemes();
		handleSelectTheme(name);
	}

	function removeTheme(name: string): void {
		ipcRenderer.send('REMOVE_THEME', name);
		fetchThemes();
	}

	const applyTheme = (theme: Theme): void => {
		Object.entries(theme.colors).forEach(([key, value]) => {
			document.documentElement.style.setProperty(`--${key}`, value);
		});
		setActiveTheme(theme);
	};

	const handleSelectTheme = (themeName: string): void => {
		const selectedTheme = themes.find((theme) => theme.name === themeName);
		if (selectedTheme) {
			ipcRenderer.send('SET_ACTIVE_THEME', themeName);
			applyTheme(selectedTheme);
		}
	};

	// Webview Logic (Webview and Search)

	function webviewValid(tab: Tab): boolean {
		const cobaltPattern = /^cobalt:\/\/[a-z]/;
		return activeTab === tab.id && tab.url !== '' && !cobaltPattern.test(tab.url);
	}

	function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setSearchInput(event.target.value);
	}

	function handleHomeSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setHomeSearchInput(event.target.value);
	}

	async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (searchInput) {
			const httpsPattern = /\b(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*\b/;
			const tldPattern =
				/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/;
			const localhostPattern = /^localhost:\d+$/;
			const cobaltPattern = /^cobalt:\/\/[a-z]/;
			const googleSearchPattern = /^(?!https?:\/\/|www\.).+\s?.*$/;
			let newUrl: string = '';
			if (httpsPattern.test(searchInput)) {
				newUrl = searchInput;
			} else if (tldPattern.test(searchInput)) {
				newUrl = `https://${searchInput}`;
			} else if (localhostPattern.test(searchInput)) {
				newUrl = `http://${searchInput}`;
			} else if (cobaltPattern.test(searchInput)) {
				newUrl = searchInput;
				const lowercaseName = newUrl.split('//')[1];
				const firstLetter = lowercaseName.slice(0, 1);
				const rest = lowercaseName.slice(1, lowercaseName.length);
				const newName = firstLetter.toUpperCase() + rest;
				const updatedTabs = tabs.map((tab) =>
					tab.id === activeTab ? { ...tab, url: newUrl, name: newName } : tab
				);
				setTabs(updatedTabs);
				return;
			} else if (googleSearchPattern.test(searchInput)) {
				newUrl = `https://www.google.com/search?q=${encodeURIComponent(searchInput)}`;
			}
			const updatedTabs = tabs.map((tab) =>
				tab.id === activeTab ? { ...tab, url: newUrl } : tab
			);
			setTabs(updatedTabs);
			const webview = webviewRefs.current[activeTab];
			if (webview) {
				webview.loadURL(newUrl);
				const title = await getTitle(newUrl);
				addToHistory(newUrl, title);
			}
		}
	}

	async function handleHomeSearchSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (homeSearchInput) {
			const newUrl: string = `https://www.google.com/search?q=${encodeURIComponent(homeSearchInput)}`;
			const updatedTabs = tabs.map((tab) =>
				tab.id === activeTab ? { ...tab, url: newUrl } : tab
			);
			setTabs(updatedTabs);
			tabs[activeTabIndex].url = newUrl;
			setSearchInput(tabs[activeTabIndex].url);
			const title = await getTitle(newUrl);
			addToHistory(newUrl, title);
		}
	}

	const handleGoBack = (): void => {
		const webview = webviewRefs.current[activeTab];
		if (webview && canGoBack) {
			webview.goBack();
		}
	};

	const handleGoForward = (): void => {
		const webview = webviewRefs.current[activeTab];
		if (webview && canGoForward) {
			webview.goForward();
		}
	};

	const handleReload = (): void => {
		const webview = webviewRefs.current[activeTab];
		if (webview) {
			webview.reload();
		}
	};

	const handleInspect = (): void => {
		const webview = webviewRefs.current[activeTab];
		if (webview) {
			webview.openDevTools();
		}
	};

	const handleDownload = (url: string): void => {
		ipcRenderer.send('download', {
			payload: {
				url: url
			}
		});
	};

	// Utility functions

	const getTitle = async (url: string): Promise<string> => {
		try {
			const response = await fetch(
				`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
			);
			if (!response.ok) {
				throw new Error('Network response was not ok.');
			}

			const { contents: html } = await response.json();
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const titleElement = doc.querySelector('title');

			return titleElement?.textContent || 'No title found';
		} catch (err) {
			console.error('Error getting title:', err);
			throw err;
		}
	};

	function parseLocaleString(time: Date): string {
		const suffixes = ['th', 'st', 'nd', 'rd'];
		const dateStr = time.toDateString().split(' ');
		const day = parseInt(dateStr[2]);
		const suffix = suffixes[day % 10 > 3 || [11, 12, 13].includes(day % 100) ? 0 : day % 10];
		const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(time);
		const formattedDay = `${day}${suffix}`;

		const hours = time.getHours();
		const minutes = time.getMinutes();
		const ampm = hours >= 12 ? 'pm' : 'am';
		const formattedHours = hours % 12 || 12;
		const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
		const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

		return `${formattedDay} ${month} ${timeString}`;
	}

	function parseThemeProperty(input: string): string {
		return input
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}

	// UseEffects

	useEffect(() => {
		const handleWindowControls = (): void => {
			if (!ipcRenderer) return;

			const actions = [
				{ id: 'min-button', action: 'MINIMIZE_WINDOW' },
				{ id: 'max-button', action: 'MAXIMIZE_WINDOW' },
				{ id: 'restore-button', action: 'RESTORE_WINDOW' },
				{ id: 'close-button', action: 'CLOSE_APP' }
			];

			actions.forEach(({ id, action }) => {
				const element = document.getElementById(id);
				if (element) {
					element.addEventListener('click', () => {
						ipcRenderer.send('TITLE_BAR_ACTION', action);
						return;
					});
				}
			});

			ipcRenderer.removeAllListeners('unmaximized');
			ipcRenderer.removeAllListeners('maximized');

			ipcRenderer.on('unmaximized', () => {
				document.getElementById('restore-button')?.classList.add('hidden');
				document.getElementById('max-button')?.classList.remove('hidden');
			});

			ipcRenderer.on('maximized', () => {
				document.getElementById('restore-button')?.classList.remove('hidden');
				document.getElementById('max-button')?.classList.add('hidden');
			});
		};

		if (document.readyState === 'complete') {
			handleWindowControls();
		} else {
			document.addEventListener('readystatechange', () => {
				if (document.readyState === 'complete') {
					handleWindowControls();
				}
			});
		}

		return (): void => {
			const actions = ['min-button', 'max-button', 'restore-button', 'close-button'];
			actions.forEach((id) => {
				const element = document.getElementById(id);
				if (element) {
					element.removeEventListener('click', () => {});
				}
			});

			ipcRenderer?.removeAllListeners('unmaximized');
			ipcRenderer?.removeAllListeners('maximized');
		};
	}, []);

	useEffect(() => {
		ipcRenderer.on('new-tab', () => {
			addTab();
		});
		ipcRenderer.on('go-to-tab-1', () => {
			setActivePage(tabs[0].id);
		});
		ipcRenderer.on('go-to-tab-2', () => {
			setActivePage(tabs[1].id);
		});
		ipcRenderer.on('go-to-tab-3', () => {
			setActivePage(tabs[2].id);
		});
		ipcRenderer.on('go-to-tab-4', () => {
			setActivePage(tabs[3].id);
		});
		ipcRenderer.on('go-to-tab-5', () => {
			setActivePage(tabs[4].id);
		});
		ipcRenderer.on('go-to-tab-6', () => {
			setActivePage(tabs[5].id);
		});
		ipcRenderer.on('go-to-tab-7', () => {
			setActivePage(tabs[6].id);
		});
		ipcRenderer.on('go-to-tab-8', () => {
			setActivePage(tabs[7].id);
		});
		ipcRenderer.on('go-to-tab-9', () => {
			setActivePage(tabs[tabs.length - 1].id);
		});
		const handleContextMenuCommand = (_event, command, data): void => {
			switch (command) {
				case 'back':
					handleGoBack();
					break;
				case 'forward':
					handleGoForward();
					break;
				case 'reload':
					handleReload();
					break;
				case 'inspect':
					handleInspect();
					break;
				case 'open-link-new-tab':
					openLinkInNewTab(data);
					break;
				case 'copy-link':
				case 'copy':
					clipboard.writeText(data, 'selection');
					break;
				case 'save-image':
					handleDownload(data);
					break;
				case 'search':
					openLinkInNewTab(`https://www.google.com/search?q=${encodeURIComponent(data)}`);
					break;
			}
		};
		ipcRenderer.on('new-history-tab', () => {
			openCobaltPage('History', 'cobalt://history');
		});
		ipcRenderer.on('close-active-tab', () => {
			closeTab(activeTab);
		});
		ipcRenderer.on('open-last-tab', () => {
			addLastTab();
		});
		tabs.forEach((tab) => {
			const webview = webviewRefs.current[tab.id];
			if (webview) {
				webview.addEventListener('context-menu', (event) => {
					ipcRenderer.send('show-context-menu', {
						x: event.params.x,
						y: event.params.y,
						linkURL: event.params.linkURL,
						srcURL: event.params.srcURL,
						pageURL: event.params.pageURL,
						frameURL: event.params.frameURL,
						selectionText: event.params.selectionText,
						mediaType: event.params.mediaType,
						formControlType: event.params.formControlType,
						isEditable: event.params.isEditable,
						editFlags: event.params.editFlags
					});
				});
				ipcRenderer.on('reload-webview', () => {
					handleReload();
				});
				ipcRenderer.on('zoom-in', () => {
					webview.setZoomLevel(webview.getZoomLevel() + 0.1);
				});
				ipcRenderer.on('zoom-out', () => {
					webview.setZoomLevel(webview.getZoomLevel() - 0.1);
				});
				ipcRenderer.on('reset-zoom', () => {
					webview.setZoomLevel(0);
				});
				ipcRenderer.on('toggle-webview-devtools', () => {
					webview.openDevTools();
				});
				const handleNavigate = (): void => {
					const title = webview.getTitle();
					const url = webview.getURL();

					setTabs((prevTabs) => {
						return prevTabs.map((t) =>
							t.id === tab.id ? { ...t, name: title, url: url } : t
						);
					});

					if (tab.id === activeTab) {
						setCanGoBack(webview.canGoBack());
						setCanGoForward(webview.canGoForward());
						setSearchInput(url);
						addToHistory(url, title);
					}
				};

				const handleAboutToNavigate = (): void => {
					const title = webview.getTitle();
					const url = webview.getURL();
					setLastTab({
						name: title,
						url: url,
						id: idCounter,
						key: `key-${idCounter}`
					} as Tab);
				};

				const updateTabInfo = (): void => {
					handleNavigate();
					const title = webview.getTitle();
					const url = webview.getURL();

					setTabs((prevTabs) => {
						return prevTabs.map((t) =>
							t.id === tab.id ? { ...t, name: title, url: url } : t
						);
					});

					if (tab.id === activeTab) {
						setCanGoBack(webview.canGoBack());
						setCanGoForward(webview.canGoForward());
						setSearchInput(url);
					}
				};

				webview.addEventListener('did-finish-load', updateTabInfo);
				webview.addEventListener('did-start-navigation', handleAboutToNavigate);
				webview.addEventListener('page-title-updated', updateTabInfo);
				webview.addEventListener('dom-ready', () => {
					webview.insertCSS(`
						::-webkit-scrollbar {
							width: 15px;
							height: 10px;
						}
						::-webkit-scrollbar-track {
							background-color: rgb(32, 40, 48);
						}
						::-webkit-scrollbar-track-piece {
							background-color: rgb(18, 22, 26);
						}
						::-webkit-scrollbar-thumb {
							height: 5%;
							width: 5px;
							background-color: rgb(32, 40, 48);
							background-color: #cdd6f4;
							border: 1px rgb(18, 22, 26) solid;
						}
						::-webkit-scrollbar-thumb:hover {
							opacity: 0.2;
							background-color: #b4befe;
						}

						::-webkit-scrollbar-corner {
							background-color: rgb(32, 40, 48);
						}
					`);
				});
			}
		});

		const removeListener = ipcRenderer.on('context-menu-command', handleContextMenuCommand);
		return (): void => {
			ipcRenderer.removeAllListeners('new-tab');
			ipcRenderer.removeAllListeners('new-history-tab');
			ipcRenderer.removeAllListeners('close-active-tab');
			ipcRenderer.removeAllListeners('go-to-tab-1');
			ipcRenderer.removeAllListeners('go-to-tab-2');
			ipcRenderer.removeAllListeners('go-to-tab-3');
			ipcRenderer.removeAllListeners('go-to-tab-4');
			ipcRenderer.removeAllListeners('go-to-tab-5');
			ipcRenderer.removeAllListeners('go-to-tab-6');
			ipcRenderer.removeAllListeners('go-to-tab-7');
			ipcRenderer.removeAllListeners('go-to-tab-8');
			ipcRenderer.removeAllListeners('go-to-tab-9');
			ipcRenderer.removeAllListeners('toggle-webview-devtools');
			ipcRenderer.removeAllListeners('reload-webview');
			tabs.forEach((tab) => {
				const webview = webviewRefs.current[tab.id];
				if (webview) {
					webview.removeEventListener('did-finish-load', () => {});
					webview.removeEventListener('did-navigate', () => {});
					webview.removeEventListener('page-title-updated', () => {});

					webview.removeEventListener('context-menu', () => {});
					removeListener();
				}
			});
		};
	}, [tabs[activeTabIndex], tabs]);

	useEffect(() => {
		if (tabs[activeTabIndex]?.url === 'cobalt://history') {
			fetchHistory();
		} else if (tabs[activeTabIndex]?.url === 'cobalt://themes') {
			fetchThemes();
		}
	}, [activeTabIndex, tabs]);

	useEffect(() => {
		const fetchTitles = async (): Promise<void> => {
			const newTitles = {};
			for (const site of history.sites) {
				try {
					const titleIndex = history.sites.indexOf(site);
					const title = history.titles[titleIndex];
					newTitles[site] = title;
				} catch (error) {
					console.error('Error fetching title for', site, error);
					newTitles[site] = 'Unable to fetch title';
				}
			}
			setTitles(newTitles);
		};

		fetchTitles();
	}, [history.sites]);

	useEffect(() => {
		const loadInitialTheme = async (): Promise<void> => {
			// fetchThemes();
			// await fetchActiveTheme();
			fetchThemesAndActiveTheme();
		};
		loadInitialTheme();
		const openInNewTabHandler = (_event, url): void => {
			openLinkInNewTab(url);
		};

		ipcRenderer.on('open-in-new-tab', openInNewTabHandler);

		return (): void => {
			ipcRenderer.removeListener('open-in-new-tab', openInNewTabHandler);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event): void => {
			if (
				showThemeForm &&
				themeFormRef.current &&
				themeButtonRef.current &&
				!themeFormRef.current.contains(event.target) &&
				!themeButtonRef.current.contains(event.target)
			) {
				setShowThemeForm(false);
			} else if (
				settingsVisibility &&
				settingsBtnRef.current &&
				settingsMenuRef.current &&
				!settingsBtnRef.current.contains(event.target) &&
				!settingsMenuRef.current.contains(event.target)
			) {
				setSettingsVisibility(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return (): void => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showThemeForm, settingsVisibility]);

	return (
		<>
			<div className="frame">
				<div id="drag-region">
					<div className="tabs" draggable={false}>
						{tabs.map((tab) => (
							<div
								key={tab.id}
								onClick={() => setActivePage(tab.id)}
								className={`tab ${activeTab === tab.id ? 'active' : ''}`}
								draggable={false}
							>
								<span className="tabName">{tab.name}</span>
								<button onClick={() => closeTab(tab.id)} className="close-tab">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
										<path
											fill="#cdd6f4"
											d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
										/>
									</svg>
								</button>
							</div>
						))}
					</div>
					<button onClick={addTab} className="newTabBtn">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
							<path
								fill="#cdd6f4"
								d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"
							/>
						</svg>
					</button>
					<div id="window-controls">
						<div className="button window-hover" id="min-button">
							<img
								className="icon"
								id="min"
								alt="minimize"
								srcSet={minimize}
								draggable="false"
							/>
						</div>
						<div className="button window-hover" id="max-button">
							<img
								className="icon"
								id="max"
								alt="maximize"
								srcSet={maximize}
								draggable="false"
							/>
						</div>
						<div className="button window-hover hidden" id="restore-button">
							<img
								className="icon"
								id="restore"
								alt="restore"
								srcSet={restore}
								draggable="false"
							/>
						</div>
						<div className="button window-hover-close" id="close-button">
							<img
								className="icon"
								id="close"
								alt="close"
								srcSet={close}
								draggable="false"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="searchBarSection">
				<div className="pageBtns">
					<button className="pageBtn" onClick={handleGoBack} disabled={!canGoBack}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
							<path
								fill="#cdd6f4"
								d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
							/>
						</svg>
					</button>
					<button className="pageBtn" onClick={handleGoForward} disabled={!canGoForward}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
							<path
								fill="#cdd6f4"
								d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
							/>
						</svg>
					</button>
					<button className="pageBtn" onClick={handleReload}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
							<path
								fill="#cdd6f4"
								d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"
							/>
						</svg>
					</button>
				</div>
				<form onSubmit={handleSearchSubmit} className="searchForm">
					<label htmlFor="search-input">
						<span className="searchIcon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
								<path
									fill="#cdd6f4"
									d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
								/>
							</svg>
						</span>
						<input
							id="search-input"
							type="text"
							value={searchInput}
							onChange={handleSearchChange}
							aria-placeholder="Search Google or enter address"
							placeholder="Search Google or enter address"
							spellCheck="false"
							ref={searchInputRef}
							autoFocus
						/>
					</label>
				</form>
				<div className="pageBtns">
					<button className="pageBtn">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
							<path
								fill="#cdd6f4"
								d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
							/>
						</svg>
					</button>
					<button
						className="pageBtn"
						id="settingsBtn"
						onClick={showSettings}
						ref={settingsBtnRef}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
							<path
								fill="#cdd6f4"
								d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32-14.3 32 32z"
							/>
						</svg>
					</button>
				</div>
				{settingsVisibility ? (
					<div id="settings-menu" ref={settingsMenuRef}>
						<button onClick={settingsMenuAddTab}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
								<path
									fill="#cdd6f4"
									d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM200 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
								/>
							</svg>
							New Tab
						</button>
						<button
							onClick={() => {
								openCobaltPageFromSettings('Themes', 'cobalt://themes');
							}}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
								<path
									fill="#cdd6f4"
									d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"
								/>
							</svg>
							Themes
						</button>
						<button
							onClick={() => {
								openCobaltPageFromSettings('History', 'cobalt://history');
							}}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
								<path
									fill="#cdd6f4"
									d="M48 106.7L48 56c0-13.3-10.7-24-24-24S0 42.7 0 56L0 168c0 13.3 10.7 24 24 24l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-55.3 0c37-57.8 101.7-96 175.3-96c114.9 0 208 93.1 208 208s-93.1 208-208 208c-42.5 0-81.9-12.7-114.7-34.5c-11-7.3-25.9-4.3-33.3 6.7s-4.3 25.9 6.7 33.3C155.2 496.4 203.8 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C170.3 0 94.4 42.1 48 106.7zM256 128c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"
								/>
							</svg>
							History
						</button>
					</div>
				) : (
					<></>
				)}
			</div>

			<div className="page" style={{ width: '100%', height: '100vh' }}>
				{tabs.map((tab) => (
					<Webview
						key={tab.key}
						ref={(el: WebviewTag | null) => {
							if (el && !webviewRefs.current[tab.id]) {
								webviewRefs.current[tab.id] = el;
							}
						}}
						src={webviewValid(tab) ? tab.url : ''}
						style={{
							width: '100vw',
							height: 'calc(100vh - 102px)',
							border: 'none',
							overflowWrap: 'break-word',
							display: webviewValid(tab) ? 'flex' : 'none'
						}}
						nodeintegration
						webpreferences="allowRunningInsecureContent, javascript=yes contextIsolation=true"
					/>
				))}
				{tabs[activeTabIndex]?.url === 'cobalt://history' && (
					<div className="history-page">
						<h1>History</h1>
						<ul className="history-list">
							{history.sites.map((site, index) => (
								<li key={index} className="history-item">
									<h1>{titles[site]}</h1>
									<a
										href={site}
										onClick={(e) => {
											e.preventDefault();
											const updatedTabs = tabs.map((tab) =>
												tab.id === activeTab ? { ...tab, url: site } : tab
											);
											setTabs(updatedTabs);
										}}
									>
										{site}
									</a>
									<span className="history-timestamp">
										{parseLocaleString(new Date(history.timestamps[index]))}
									</span>
								</li>
							))}
						</ul>
						<button onClick={clearHistory} className="clear-history">
							Clear History
						</button>
					</div>
				)}
				{tabs[activeTabIndex]?.url === 'cobalt://themes' && (
					<div className="themes-page">
						<h1>Themes</h1>
						<ul className="themes-list">
							{themes.map((theme, index) => (
								<li key={index} className="theme-item">
									<h1>{theme.name}</h1>
									<div className="color-preview">
										{Object.entries(theme.colors).map(
											([colorName, colorValue]) => (
												<div key={colorName} className="color-swatch">
													<span className="color-name">
														{parseThemeProperty(colorName)}
													</span>
													<div
														className="color-box"
														style={{ backgroundColor: colorValue }}
														title={`${colorName}: ${colorValue}`}
													></div>
												</div>
											)
										)}
									</div>
									<button
										onClick={() => handleSelectTheme(theme.name)}
										className="selectTheme"
									>
										Select Theme
									</button>
									<button
										onClick={() => handleRemoveTheme(theme.name)}
										className="removeTheme"
									>
										Remove Theme
									</button>
								</li>
							))}
						</ul>
						<button
							className="add-theme"
							onClick={() => setShowThemeForm(!showThemeForm)}
							ref={themeButtonRef}
						>
							Add theme
						</button>
					</div>
				)}
				{showThemeForm && (
					<div className="new-theme" ref={themeFormRef}>
						<form onSubmit={handleAddTheme}>
							<label>
								Theme name
								<input
									className="theme-name-input"
									type="text"
									value={newThemeName}
									onChange={handleThemeInputChange}
								/>
							</label>
							<div className="color-picker-container">
								{Object.keys(newThemeColor).map((colorKey) => (
									<div key={colorKey}>
										<label htmlFor="" className="add-class-property">
											<span>{parseThemeProperty(colorKey)}</span>
											<input
												type="color"
												name={colorKey}
												value={newThemeColor[colorKey]}
												onChange={handleNewThemeColorChange}
												className="color-input"
											/>
										</label>
									</div>
								))}
							</div>
							<button type="submit" className="submit-add-theme">
								Add Theme
							</button>
						</form>
					</div>
				)}
				{activeTabIndex !== -1 && !tabs[activeTabIndex].url && (
					<div
						className="newTabPage"
						style={{
							display: activeTab === tabs[activeTabIndex].id ? 'block' : 'none'
						}}
					>
						<div className="app">
							<h1 className="title">
								<span className="cobalt-span">
									<img src={cobalt} alt="Cobalt Logo" className="cobalt-logo" />
								</span>
								Cobalt
							</h1>
							<form
								className="new-page-search-form"
								onSubmit={handleHomeSearchSubmit}
							>
								<label className="search-bar" htmlFor="">
									<span className="google-icon">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 488 512"
										>
											<path
												fill="#f0f2ff"
												d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
											/>
										</svg>
									</span>
									<input
										type="text"
										value={homeSearchInput}
										onChange={handleHomeSearchChange}
										aria-placeholder="Search with Google"
										placeholder="Search with Google"
										spellCheck="false"
									/>
								</label>
							</form>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default App;
