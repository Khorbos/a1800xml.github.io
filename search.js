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

function resultDisplay(results) {
	const resultsDiv = document.getElementById("results");
	resultsDiv.innerHTML = results;
}

function formatXml(xml) {
	console.log("formatting");
	console.log("xml");
	const options = {
		processEntities: false,
		format: true,
		ignoreAttributes: false
	};
	const builder = new fxp.XMLBuilder(options);
	const chars = builder.build(xml);
	console.log("chars", chars);
	return chars;
}

async function getXML(file, searchText) {
	searchText = "117";
	console.log("Fetching data...");
	const fString = "./xml/" + file;
	const response = await fetch(fString);
	const buffer = await response.arrayBuffer();
	const compressed = new Uint8Array(buffer);
	const decompressed = pako.inflate(compressed, { to: "string" });
	console.log("Uncompressed");

    // Start a Web Worker for processing
    const worker = new Worker('worker.js');
    worker.postMessage({ xmlString: decompressed, searchText });

    worker.onmessage = (e) => {
        const results = e.data;
        console.log('Matching results:', results);
    };
}

function serializeElement(element, indentLevel) {
	const indent = "    ".repeat(indentLevel); // 4 spaces per indent level
	let xml = `${indent}<${element.tag}>`;
	if (element.content.includes("<")) {
		xml += `\n${element.content}\n${indent}`;
	} else {
		xml += `${element.content}`;
	}
	xml += `</${element.tag}>`;
	return xml;
}

function serializeElement(element, indentLevel) {
	const indent = "    ".repeat(indentLevel); // 4 spaces per indent level
	let xml = `${indent}<${element.tag}>`;
	if (element.content.includes("<")) {
		xml += `\n${element.content}\n${indent}`;
	} else {
		xml += `${element.content}`;
	}
	xml += `</${element.tag}>`;
	return xml;
}

async function performTextSearch() {
	resultDisplay("Loading data...");
	const query = [];
	query.push(document.getElementById("langSearch").value.trim());
	query.push(document.getElementById("textSearch").value.trim());
	console.log("n", query[0], query[1]);
	const _XML = await getXML(query[0]);
	resultDisplay("Loaded data, searching for results...");
	searchXML(_XML, query[1]);
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

function searchXML(xmlDoc, query) {
	/* const assets = xmlDoc.getElementsByTagName("Text");
	console.log(assets);

	for (let asset of assets) {
		const guid = asset.querySelector("Text > GUID")?.textContent || "";
		const name = asset.querySelector("Text > Text")?.textContent || "";

		if (guid.includes(query) || name.includes(query)) {
			resultsFound = true;
			const serializer = new XMLSerializer();
			const assetStr = serializer.serializeToString(asset);
			console.log(assetStr);
			displayResult(assetStr);
		}
	}

	if (!resultsFound) {
		resultDisplay("No results found!");
	} */
	resultDisplay(xmlDoc);
}

function displayResult(result) {
	const resultsDiv = document.getElementById("results");
	const resultItem = document.createElement("div");
	resultItem.className = "result-item";
	resultItem.textContent = result;
	resultsDiv.appendChild(resultItem);
}

/* 
<script>
		if (typeof fxp.XMLBuilder !== 'undefined') {
			console.log('fxBuilder is loaded');
		} else {
			console.log('fxBuilder is not loaded');
		}
		if (typeof fxp.XMLParser !== 'undefined') {
			console.log('fxparser is loaded');
		} else {
			console.log('fxparser is not loaded');
		}
	</script>
*/
console.log("loaded 10:40");
