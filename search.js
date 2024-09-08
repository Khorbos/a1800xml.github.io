/**
 * @param {number} GUID the GUID to retrieve
 * @returns XML Object from string
 * **/
function getDataFromSessionStorage(GUID) {
    const storedData = sessionStorage.getItem(GUID);
    return storedData ? JSON.parse(storedData) : null;
}

// Function to switch tabs
function switchTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    
    // Show the selected tab content
    document.getElementById(tabId).style.display = 'block';
}

// Function to display JSON as XML
function displayAsXML(data) {
    const xmlView = document.getElementById('xml-view');
    xmlView.textContent = jsonToXML(data); // Assuming you have a function to convert JSON to XML
}

// Function to display JSON as formatted list
function displayAsList(data) {
    const listView = document.getElementById('list-view');
    const listItems = data.map(item => {
        // Generate path for each item e.g. "Properties/Building/BuildingTypeFactory"
        return `${item.path || ''}/${item.value || ''}`;
    });
    listView.innerHTML = `<pre>${listItems.join('\n')}</pre>`;
}

// Add event listeners for tab switching and rendering the content
document.getElementById('detail_destination').addEventListener('click', () => {
    const data = getDataFromSessionStorage('yourDataKey');
    if (data) {
        displayAsXML(data);
        switchTab('xml-view');
    }
});

document.getElementById('detail_destination').addEventListener('click', () => {
    const data = getDataFromSessionStorage('yourDataKey');
    if (data) {
        displayAsList(data);
        switchTab('list-view');
    }
});

// Call the default tab on load (optional)
window.onload = function() {
    document.getElementById('detail_destination').click();  // Default to list view
};

function jsonToXML(json) {
    // Configuration for XML formatting (optional, you can customize it)
    const options = {
        attributeNamePrefix : "@_",
        textNodeName : "#text",
        ignoreAttributes : false,
        format: true,        // Pretty print the XML output
        indentBy: "  ",      // Two spaces for indenting
        supressEmptyNode: true
    };

    // Create a parser instance with the options
    const parser = new fastxmlparser.j2xParser(options);

    // Convert JSON to XML
    const xml = parser.parse(json);

    return xml;
}

function displayAsXML(data) {
    const xmlView = document.getElementById('xml-view');
    xmlView.textContent = jsonToXML(data);  // Use fast-xml-parser to convert JSON to XML
}


/**
 *
 * **/

function findTagContent(data, tags) {
	let result = { GUID: "", Text: "", Name: "" };

	function search(node) {
		// Check if the node matches any of the tags
		if (tags.includes(node.tag)) {
			if (node.tag === "GUID") {
				result.GUID = node.content;
			} else if (node.tag === "Text") {
				result.Text = node.content;
			} else if (node.tag === "Name") {
				result.Name = node.content;
			}
		}

		// Recursively search children if they exist
		if (node.children && Array.isArray(node.children)) {
			node.children.forEach(child => search(child));
		}
	}

	// Start the search from the root
	search(data);
	return result;
}

/**
 * @param {object} results
 * **/
function displayResultList(results) {
    console.log("display",results)
	const resultsList = document.getElementById("table_result_list");
	resultsList.innerHTML = "";
	const tr = document.createElement("tr");
	["GUID", "Text", "Link"].forEach(ele => {
		const th = document.createElement("th");
		th.textContent = ele;
		tr.appendChild(th);
	});
	resultsList.appendChild(tr);
	// Process each result and create a table row
	results.forEach(result => {
		const tr = document.createElement("tr");
		const guid = findTagContent(result, ["GUID", "Name", "Text"]);
		/* console.log(guid); */
		const tdGuid = document.createElement("td");
		sessionStorage.setItem(guid.GUID, JSON.stringify(result));
		tdGuid.textContent = guid.GUID;
		tr.appendChild(tdGuid);
		const tdTextOrName = document.createElement("td");
		tdTextOrName.textContent = guid.Text;
		tr.appendChild(tdTextOrName);

		/* link? */
		const tdLink = document.createElement("td");
		tdLink.className = "material-symbols-outlined";
		tdLink.textContent = "arrow_outward";
		tr.appendChild(tdLink);

		resultsList.appendChild(tr);
	});
}
/**
 * @param {*} _Search
 * **/
function ioData(_Search) {}

/**
 * @param {string} _file e.g. "assets.xml.gz"
 * @returns {string}
 * **/
async function fetchData(_file) {
	const cachedData = sessionStorage.getItem(_file);
	if (cachedData) {
		return cachedData;
	} else {
		return await fetch("./xml/" + _file)
			.then(response => response.arrayBuffer())
			.then(buffer => {
				const compressed = new Uint8Array(buffer);
				const decompressed = pako.inflate(compressed, { to: "string" });
				try {
					sessionStorage.setItem(_file, decompressed);
				} catch (error) {
					console.log("uncompressed file exceeds sessionStorageLimit, need to fetch every time :(");
				}
				return decompressed;
			})
			.catch(error => {
				console.error("Error fetching or decompressing data:", error);
				return 0;
			});
	}
}

/**
 * @param {string} searchFile e.g. assets.xml.gz
 * @param {string} searchString e.g. Human7
 * @param {string} parentTag e.g. asset
 * @param {string[]} [searchTag=["GUID","Name"]] e.g. GUID, Name, Text, Template
 * @param {*} nonstrict null/undefined = off; on=off/non-strict
 * **/

async function perfSearch({ searchFile, searchString, searchTag = ["GUID", "Name", "Text"], parentTag, nonstrict }) {
	const _XML = await fetchData(searchFile);

	const worker = new Worker("worker.js");
	worker.postMessage({ _XML, searchString, searchTag, parentTag, nonstrict });

	worker.onmessage = e => {
		const results = e.data;
		displayResultList(results);
	};
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
			const formDataObj = Object.fromEntries(formData.entries());
			perfSearch(formDataObj);
		},
		true
	);
});
