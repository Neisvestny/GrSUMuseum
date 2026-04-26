export const PDF_PATH = '/book.pdf';
export const PDF_SCALE = 1.4;

const DB_NAME = 'book-cache';
const DB_STORE = 'pages';
const DB_KEY = 'book.pdf';

async function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function getCachedPages(): Promise<string[] | null> {
	const db = await openDb();
	return new Promise((resolve) => {
		const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => resolve(null);
	});
}

export async function saveCachedPages(pages: string[]): Promise<void> {
	const db = await openDb();
	return new Promise((resolve) => {
		const req = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(pages, DB_KEY);
		req.onsuccess = () => resolve();
		req.onerror = () => resolve();
	});
}
