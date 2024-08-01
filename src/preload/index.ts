import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {};

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('electron', {
			ipcRenderer: {
				send: (channel: string, data) => {
					ipcRenderer.send(channel, data);
				},
				on: (channel: string, func: (...args: unknown[]) => void) => {
					ipcRenderer.on(channel, (_event, ...args) => func(...args));
				},
				invoke: (channel: string, data) => {
					return ipcRenderer.invoke(channel, data);
				}
			}
		});
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI;
	// @ts-ignore (define in dts)
	window.api = api;
}
