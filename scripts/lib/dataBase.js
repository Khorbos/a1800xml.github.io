const dbName = "a1800xmlDB";

let dbDelete = indexedDB.deleteDatabase(dbName);
let dbRequest = indexedDB.open(dbName); //v1 by default
/* let dbCRequest = indexedDB.close(); */

/**
 * dbRequest callback functions
 * **/

/**
 * event from callback
 * error handler
 * **/
dbRequest.onerror = event => {
	console.error(`Database error: ${event.target.error?.message}`);
};
/**
 * event from callback
 * setup & upgrade handler
 * **/
dbRequest.onupgradeneeded = event => {
	const db = event.target.result;
	const objectStore = db.createObjectStore("results", { keyPath: "GUID" });
};

// Add data to IndexedDB
function storeInIndexedDB(results) {
	const request = indexedDB.open(dbName);
	request.onsuccess = function (event) {
		const db = event.target.result;
		const transaction = db.transaction(["results"], "readwrite");
		const objectStore = transaction.objectStore("results");
		/* objectStore.add(results); */
		results.forEach(result => {
			try {
				objectStore.add(result);
			} finally {
				console.error("could add", result);
			}
		});

		transaction.oncomplete = function () {
			console.log("All results stored in IndexedDB");
		};
	};
}

// Retrieve data from IndexedDB
function getFromIndexedDB(guid, callback) {
	const request = indexedDB.open(dbName);
	request.onsuccess = function (event) {
		const db = event.target.result;
		const transaction = db.transaction(["results"], "readonly");
		const objectStore = transaction.objectStore("results");

		const getRequest = objectStore.get(guid);
		getRequest.onsuccess = function () {
			callback(getRequest.result); // Pass the result to a callback function
		};
	};
}

// Example usage:
const results = [
	{ GUID: "123", Text: "Result 1" },
	{ GUID: "456", Text: "Result 2" }
];
storeInIndexedDB(results);

getFromIndexedDB("123", result => {
	console.log("Retrieved from IndexedDB:", result);
});
