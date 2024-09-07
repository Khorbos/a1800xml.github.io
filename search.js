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
	const resultsList = document.getElementById("table_result_list");
	resultsList.innerHTML = "";
	const tr = document.createElement("tr");
	["GUID", "Text", "Link"].forEach(ele => {
		const th = document.createElement("th");
		th.textContent = ele;
		tr.appendChild(th);
		console.log("done");
	});
	resultsList.appendChild(tr);
	// Process each result and create a table row
	results.forEach(result => {
		const tr = document.createElement("tr");
		const guid = findTagContent(result, ["GUID", "Name", "Text"]);
		/* console.log(guid); */
		const tdGuid = document.createElement("td");
		tdGuid.textContent = guid.GUID;
		tr.appendChild(tdGuid);
		const tdTextOrName = document.createElement("td");
		tdTextOrName.textContent = guid.Text;
		tr.appendChild(tdTextOrName);

		// Add placeholder for Link (can be filled later if needed)
		const tdLink = document.createElement("td");
		tdLink.textContent = ""; // Empty for now, modify as needed
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
	const cachedData = localStorage.getItem(_file);
	if (cachedData) {
		return cachedData;
	} else {
		return await fetch("./xml/" + _file)
			.then(response => response.arrayBuffer())
			.then(buffer => {
				const compressed = new Uint8Array(buffer);
				const decompressed = pako.inflate(compressed, { to: "string" });
				try {
					localStorage.setItem(_file, decompressed);
				} catch (error) {
					console.log("uncompressed file exceeds localStorageLimit, need to fetch every time :(");
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
 * @param {boolean} strict null = on; true=off/non-strict
 * **/

async function perfSearch({ searchFile, searchString, searchTag = ["GUID", "Name", "Text"], parentTag, strict = null }) {
	const _XML = await fetchData(searchFile);

	const worker = new Worker("worker.js");
	worker.postMessage({ _XML, searchString, searchTag, parentTag, strict });

	worker.onmessage = e => {
		const results = e.data;
		console.log("Matching results:", results);
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
