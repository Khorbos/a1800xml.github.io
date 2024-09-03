function performSearch() {
    const query = document.getElementById('searchQuery').value.trim();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Loading data...';

    fetch('xml/properties.xml.gz')
        .then(response => response.arrayBuffer()) // Fetch the gzipped file as a binary array
        .then(buffer => {
            const compressed = new Uint8Array(buffer);
            const decompressed = pako.inflate(compressed, { to: 'string' }); // Use pako to decompress
            console.log("decompressed",decompressed);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(decompressed, "text/xml");
            console.log(xmlDoc);

            // Perform the search in the decompressed XML
            searchXML(xmlDoc, query);
        })
        .catch(error => {
            console.error('Error fetching or decompressing the file:', error);
            resultsDiv.innerHTML = 'Failed to load data.';
        });
}

function searchXML(xmlDoc, query) {
    const resultsDiv = document.getElementById('results');
    const assets = xmlDoc.getElementsByTagName('Asset');
    let resultsFound = false;

    resultsDiv.innerHTML = ''; // Clear previous results

    for (let asset of assets) {
        const guid = asset.querySelector('Values > Standard > GUID')?.textContent || '';
        const name = asset.querySelector('Values > Standard > Name')?.textContent || '';

        if (guid.includes(query) || name.includes(query)) {
            resultsFound = true;
            const serializer = new XMLSerializer();
            const assetStr = serializer.serializeToString(asset);
            displayResult(assetStr);
        }
    }

    if (!resultsFound) {
        resultsDiv.innerHTML = 'No results found';
    }
}

function displayResult(result) {
    const resultsDiv = document.getElementById('results');
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.textContent = result;
    resultsDiv.appendChild(resultItem);
}