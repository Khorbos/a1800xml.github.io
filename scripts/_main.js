/* 
	
	<script src="scripts/fxp.min.js"></script>
	<!-- fast-xml-parser -->
	 <script src="scripts/dataBase.js"></script>
	 <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
	<!-- ModelViewer GLB -->
	 
	 
	 */
import * as pako from "https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js";
/* zlib library to unpack */

import * as iDB from "./lib/dataBase.js";
/* database modules */

import * as searches from "./lib/iSearches.js";

// Function to switch tabs
function switchTab(tabId) {
	// Hide all tab content
	document.querySelectorAll(".tab-content").forEach(tab => (tab.style.display = "none"));

	// Show the selected tab content
	document.getElementById(tabId).style.display = "block";
}

// Function to display JSON as formatted list
function displayAsList(data) {
	const listView = document.getElementById("list-view");
	const listItems = data.map(item => {
		// Generate path for each item e.g. "Properties/Building/BuildingTypeFactory"
		return `${item.path || ""}/${item.value || ""}`;
	});
	listView.innerHTML = `<pre>${listItems.join("\n")}</pre>`;
}

// Add event listeners for tab switching and rendering the content
document.getElementById("detail_destination").addEventListener("click", () => {
	const data = getDataFromSessionStorage("yourDataKey");
	if (data) {
		displayAsXML(data);
		switchTab("xml-view");
	}
});

document.getElementById("detail_destination").addEventListener("click", () => {
	const data = getDataFromSessionStorage("yourDataKey");
	if (data) {
		displayAsList(data);
		switchTab("list-view");
	}
});

// Call the default tab on load (optional)
window.onload = function () {
	document.getElementById("detail_destination").click(); // Default to list view
};

function jsonToXML(json) {
	// Configuration for XML formatting (optional, you can customize it)
	const options = {
		attributeNamePrefix: "@_",
		textNodeName: "#text",
		ignoreAttributes: false,
		format: true, // Pretty print the XML output
		indentBy: "  ", // Two spaces for indenting
		supressEmptyNode: true
	};

	// Create a parser instance with the options
	const parser = new fastxmlparser.j2xParser(options);

	// Convert JSON to XML
	const xml = parser.parse(json);

	return xml;
}

function displayAsXML(data) {
	const xmlView = document.getElementById("xml-view");
	xmlView.textContent = jsonToXML(data); // Use fast-xml-parser to convert JSON to XML
}

/**
 * @param {object} results
 * **/
function displayResultList(results) {
	/* get ResultsListTarget */
	const resultsList = document.getElementById("result_list_target");
	/* empty */
	resultsList.innerHTML = "";
	/* process each element */
	var divList = [];
	results.forEach(result => {
		/* get GUID Text and Name */
		const rTag = findTagContent(result, ["GUID", "Name", "Text"]);
		/* feed list with items in GUID */
		divList[rTag.GUID] = document.createElement("div");
		divList[rTag.GUID].className = "result_list_row";
		divList.dataGUID = rTag.GUID;

		/* const divElements = ["resDivGUID", "resDivSht", "resDivLnk"];
		const elements = {};

		divElements.forEach(name => {
			elements[name] = document.createElement("div");
		}); */

		const resDivGUID = document.createElement("div");
		const resDivSht = document.createElement("div");
		const resDivLnk = document.createElement("div");
		const resDivShort = document.createElement("span");
		resDivGUID.textContent = rTag.GUID;
		resDivShort.textContent = rTag.Name.length < 2 ? rTag.Text : rTag.Name;
		resDivLnk.className = "material-symbols-outlined btn";
		resDivLnk.dataGUID = rTag.GUID;
		resDivLnk.textContent = "arrow_outward";
		resDivSht.appendChild(resDivShort);
		[resDivGUID, resDivSht, resDivLnk].forEach(ele => {
			divList[rTag.GUID].appendChild(ele);
		});
	});
	divList.forEach(ele => {
		resultsList.appendChild(ele);
	});
}

/**
 * @param {string} _file e.g. "assets.xml.gz"
 * @returns {string}
 * **/
async function fetchData(_file) {
	return await fetch("./xml/" + _file)
		.then(response => response.arrayBuffer())
		.then(buffer => {
			const compressed = new Uint8Array(buffer);
			const decompressed = pako.inflate(compressed, { to: "string" });
			return decompressed;
		})
		.catch(error => {
			console.error("Error fetching or decompressing data:", error);
			return 0;
		});
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

	const worker = new Worker("worker/wSAX.js");
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

/**
 *
 * **/
window.addEventListener("beforeunload", () => {
	const dbName = "your-database-name";
	const request = indexedDB.deleteDatabase(dbName);
	request.onsuccess = () => {
		console.log(`Database ${dbName} deleted successfully.`);
	};
	request.onerror = event => {
		console.error("Database deletion failed:", event.target.error);
	};
});
