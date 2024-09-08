importScripts("https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js");
/* Simple API for XML */

self.onmessage = function (e) {
	const { _XML, searchString, searchTag, parentTag, nonstrict } = e.data;
	console.log("started worker");
	/* console.log(_XML, searchString, searchTag, parentTag, strict); */
	const [parser, results] = [sax.parser(true), []];
	let [currentTag, currentContent, stack] = [null, "", []];

	// Start the parser
	parser.onopentag = node => {
		currentTag = node.name;
		stack.push({ tag: node.name, children: [] });
	};

	parser.ontext = text => {
		if (currentTag) {
			currentContent += text.trim();
		}
	};

	parser.onclosetag = tagName => {
		const element = stack.pop();
		element.content = currentContent;

		if (stack.length > 0) {
			// Add the current element as a child of its parent
			stack[stack.length - 1].children.push(element);
		}

		if (
			searchTag.includes(tagName) &&
			(nonstrict ? currentContent.toLowerCase().includes(searchString.toLowerCase()) : currentContent.toLowerCase() === searchString.toLowerCase())
		) {
			// Search for the nearest matching parent in the stack
			/* console.log("result"); */
			for (let i = stack.length - 1; i >= 0; i--) {
				if (stack[i].tag == parentTag) {
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

	// Send the results back to the main thread
	self.postMessage(results);
};
