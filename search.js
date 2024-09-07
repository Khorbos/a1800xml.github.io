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
