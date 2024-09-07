/* 
    Variables
    itemSearch - first input for GUID/Templates
    langSearch - Language for Texts-Search
    textSearch - Text to Search for
*/

/* 
    Functions
    performTextSearch()
    performAssetSearch()
    getXML(fileName)
    resultDisplay(String)
*/

/* Global */

function serializeElement(element, indent = 0) {
	const indentation = "\t".repeat(indent); // Two spaces per indent level
	let serialized = `${indentation}<${element.tag}>`; // Opening tag

	if (element.content) {
		serialized += `${element.content}`;
	}

	if (element.children && element.children.length > 0) {
		serialized += `\n`; // Add line break before children
		element.children.forEach(child => {
			serialized += `${serializeElement(child, indent + 1)}\n`; // Recursively serialize each child
		});
		serialized += `${indentation}`; // Closing indentation
	}

	serialized += `</${element.tag}>`; // Closing tag
	return serialized;
}

function resultDisplay(results) {
	const resultsDiv = document.getElementById("results");
	resultsDiv.innerHTML = results;
}

function displayResult(result) {
	const resultsDiv = document.getElementById("results");
	resultsDiv.innerHTML = "";
	const test = document.createElement("div");
	test.id = "result-short";
	resultsDiv.appendChild(test);
	result.map(ele => {
		console.log(typeof ele, ele, serializeElement(ele));
		const resEle = document.createElement("div");
		resEle.textContent = serializeElement(ele);
		test.appendChild(resEle);
	});
}

async function getXML(file) {
	console.log("Fetching data...");
	const fString = "./xml/" + file;
	const response = await fetch(fString);
	const buffer = await response.arrayBuffer();
	const compressed = new Uint8Array(buffer);
	const decompressed = pako.inflate(compressed, { to: "string" });
	return decompressed;
}

async function performTextSearch() {
	resultDisplay("Loading data...");
	const _XML = await getXML(document.getElementById("langSearch").value.trim());

	resultDisplay("Loaded data, searching for results...");

	// Start a Web Worker for processing
	const worker = new Worker("worker.js");
	const searchText = document.getElementById("textSearch").value.trim();
	const parentTags = ["text"];
	worker.postMessage({ xmlString: _XML, searchText, parentTags });

	worker.onmessage = e => {
		const results = e.data;
		console.log("Matching results:", results);
		displayResult(results);
	};
}

async function performAssetSearch() {
	resultDisplay("Loading data...");
	const _XML = await getXML("assets.xml.gz");
	resultDisplay("Loaded data, searching for results...");

	// Start a Web Worker for processing
	const worker = new Worker("worker.js");
	const searchText = document.getElementById("assetSearch").value.trim();
	const parentTags = ["asset"];
	worker.postMessage({ xmlString: _XML, searchText, parentTags });

	worker.onmessage = e => {
		const results = e.data;
		console.log("Matching results:", results);
		console.log("type", typeof results);
		displayResult(results);
	};
}

/* rework of functions for better stuff */

/**
 * @param {string} _file
 * @returns {string}
 * **/
async function fetchData(_file) {
	const cachedData = localStorage.getItem(_file);
	if (cachedData) {
		console.log("Using cached file.");
		return cachedData;
	} else {
		console.log("fetching and storing data.");
		console.log("Fetching data...");
		const fString = "./xml/" + _file;
		const response = await fetch(fString);
		const buffer = await response.arrayBuffer();
		const compressed = new Uint8Array(buffer);
		const decompressed = pako.inflate(compressed, { to: "string" });
		localStorage.setItem(_file, decompressed);
		console.log("stored!");
		return decompressed;
	}
	return 0;
}

/**
 * @param {string} parentTag
 * @param {string} searchFile
 * @param {boolean} strict
 * @param {string} searchString
 * **/

async function perfSearch(searchFile, parentTag, strict, searchString) {
	console.log(searchFile, parentTag, strict, searchString);
	return 0;
}

/* main entry for Search */
window.addEventListener("DOMContentLoaded", function () {
	var form = document.getElementById("search-form");

	document.addEventListener(
		"submit",
		function (event) {
			event.preventDefault(); // Prevent the default form submission behavior

			const form = event.target; // Get the form element that triggered the submit

			const formData = new FormData(form);
			console.log(formData);

			formData.forEach((value, key) => {
				console.log(`${key}: ${value}`);
			});

			// Optionally submit the form programmatically or handle the data here
		},
		true
	);
});
