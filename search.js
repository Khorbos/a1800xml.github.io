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

function formatXml(xml, tab) { // tab = optional indent value, default is tab (\t)
    var formatted = '', indent= '';
    tab = tab || '\t';
    xml.split(/>\s*</).forEach(function(node) {
        if (node.match( /^\/\w/ )) indent = indent.substring(tab.length); // decrease indent by one 'tab'
        formatted += indent + '<' + node + '>\r\n';
        if (node.match( /^<?\w[^>]*[^\/]$/ )) indent += tab;              // increase indent
    });
    return formatted.substring(1, formatted.length-3);
    const options = {
        processEntities:false,
        format: true,
        ignoreAttributes: false,
        cdataPropName: "phone"
    };
    const builder = new fxparser.XMLBuilder(options);
    const chars = builder.build(xml);
	return chars;
}

async function getXML(file) {
    const fString = "xml/" + file;
    const response = await fetch(fString);
    const buffer = await response.arrayBuffer();
    const compressed = new Uint8Array(buffer);
    const decompressed = pako.inflate(compressed, { to: "string" });
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(decompressed, "text/xml");
    return xmlDoc; // Return the parsed XML document
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
	const assets = xmlDoc.getElementsByTagName("Text");
	let resultsFound = false;

	for (let asset of assets) {
		const guid = asset.querySelector("Text > GUID")?.textContent || "";
		const name = asset.querySelector("Text > Text")?.textContent || "";

		if (guid.includes(query) || name.includes(query)) {
			resultsFound = true;
			const serializer = new XMLSerializer();
			const assetStr = serializer.serializeToString(asset);
			displayResult(formatXml(assetStr,' '));
		}
	}

	if (!resultsFound) {
		resultDisplay("No results found!");
	}
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