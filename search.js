/* 
    Variables
    itemSearch - first input for GUID/Templates
    langSearch - Language for Texts-Search
    textSearch - Text to Search for
*/

/* 
    Functions
    performTextSearch()
    performGUIDSearch()
    getXML(fileName)
    resultDisplay(String)
*/

/* Global */

function serializeElement(element, indent = 0) {
    const indentation = '  '.repeat(indent); // Two spaces per indent level
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
	result.map(ele => {
		console.log(ele, serializeElement(ele));
		const resEle = document.createElement("div");
		resEle.className = "result-item";
		resEle.textContent = serializeElement(ele);
		resultsDiv.appendChild(resEle);
	});
	/* const resultItem = document.createElement("div");
	resultItem.className = "result-item";
	result.map(item => console.log(item));
	resultItem.textContent = result.map(item => `"<pre>"<${item.tag}>${item.content}</${item.tag}>"</pre>"`).join("\n");
	//	result.map(item => `<${item.tag}>${item.content}</${item.tag}>`).join("\n");
	resultsDiv.appendChild(resultItem);*/
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
	worker.postMessage({ xmlString: _XML, searchText });

	worker.onmessage = e => {
		const results = e.data;
		console.log("Matching results:", results);
		console.log("type", typeof results);
		displayResult(results);
	};
}

function performSearch() {
	const query = document.getElementById("searchQuery").value.trim();

	resultsDiv.innerHTML = "Loading data...";

	fetch("xml/properties.xml.gz")
		.then(response => response.arrayBuffer()) // Fetch the gzipped file as a binary array
		.then(buffer => {
			const compressed = new Uint8Array(buffer);
			const decompressed = pako.inflate(compressed, { to: "string" }); // Use pako to decompress
			console.log("decompressed", decompressed);
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(decompressed, "text/xml");
			console.log(xmlDoc);

			// Perform the search in the decompressed XML
			searchXML(xmlDoc, query);
		})
		.catch(error => {
			console.error("Error fetching or decompressing the file:", error);
			resultsDiv.innerHTML = "Failed to load data.";
		});
}

console.log("loaded 20:50");
