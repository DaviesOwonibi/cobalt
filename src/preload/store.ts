import electron from 'electron';
import path from 'path';
import fs from 'fs';

interface StoreOptions {
	configName: string;
	defaults: Record<string, unknown>;
}

class Store {
	private path: string;
	private data: Record<string, unknown>;
	private defaults: Record<string, unknown>;

	constructor(opts: StoreOptions) {
		const userDataPath = electron.app.getPath('userData');
		this.path = path.join(userDataPath, opts.configName + '.json');
		this.defaults = opts.defaults;
		this.data = parseDataFile(this.path, this.defaults);
	}

	get(key: string): unknown {
		return this.data[key];
	}

	set(key: string, val: unknown): void {
		this.data[key] = val;
		fs.writeFileSync(this.path, JSON.stringify(this.data));
	}

	remove(key: string): void {
		this.data[key];
	}

	/**
	 * Clears all data in the store, resetting it to the default values.
	 */
	clearAll(): void {
		this.data = { ...this.defaults };
		fs.writeFileSync(this.path, JSON.stringify(this.data));
	}
}

function parseDataFile(
	filePath: string,
	defaults: Record<string, unknown>
): Record<string, unknown> {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (error) {
		return defaults;
	}
}

export default Store;
