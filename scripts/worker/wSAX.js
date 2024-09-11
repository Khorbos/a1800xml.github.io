importScripts("https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js");
/* Simple API for XML */

self.onmessage = function (e) {
	const { _XML, searchString, searchTag, parentTag, nonstrict } = e.data;
	console.log("started worker");
	const [parser, results] = [sax.parser(true), []];
	let [currentTag, currentContent, stack] = [null, null, []];

	// Start the parser
	parser.onopentag = node => {
		currentTag = node.name;
		// Push an empty object to the stack, the key will be assigned when the tag closes
		stack.push({});
		currentContent = ""; // Reset content for the new tag
	};

	parser.ontext = text => {
		if (currentTag) {
			currentContent += text.trim();
		}
	};

	parser.onclosetag = tagName => {
		const element = stack.pop();
		console.log(element);
		// Assign the current tag name as the key and its content as the value
		element[tagName] = currentContent || "";

		if (stack.length > 0) {
			const parent = stack[stack.length - 1];

			// Check if the parent has a 'children' property, if not, initialize it as an empty array
			if (!parent.children) {
				parent.children = [];
			}

			// Add the current element as a child of its parent
			parent.children.push(element);
		}

		// Check for matching search tag and string
		if (
			searchTag.includes(tagName) &&
			(nonstrict ? currentContent.toLowerCase().includes(searchString.toLowerCase()) : currentContent.toLowerCase() === searchString.toLowerCase())
		) {
			// Search for the nearest matching parent in the stack
			for (let i = stack.length - 1; i >= 0; i--) {
				if (stack[i][parentTag] || (stack[i].tag && stack[i].tag === parentTag)) {
					results.push(stack[i]); // Push the matching parent tag
					break;
				}
			}
		}

		// Reset the currentTag and content for the next element
		currentTag = null;
		currentContent = "";
	};

	// Execute the parser
	parser.write(_XML).close();
	console.log("worker", results);
	// Send the results back to the main thread
	self.postMessage(results);
};