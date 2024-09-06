importScripts("https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js");
/* importScripts("scripts/sax-parser.2.0.3.js"); */
/* Simple API for XML */
self.onmessage = function (e) {
	const { xmlString, searchText, parentTags } = e.data; // `parentTags` is an array of parent tag names like ['asset', 'text']
	const parser = sax.parser(true);
	const results = [];
	let currentTag = null;
	let currentContent = "";
	let stack = [];

	// Start the parser
	parser.onopentag = node => {
		currentTag = node.name;
		stack.push({ tag: node.name, children: []});
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

		// Case-insensitive search for the target text
		if (currentContent.toLowerCase().includes(searchText.toLowerCase())) {
			// Search for the nearest matching parent in the stack
			for (let i = stack.length - 1; i >= 0; i--) {
				if (parentTags.includes(stack[i].tag.toLowerCase())) {
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
	parser.write(xmlString).close();

	// Send the results back to the main thread
	self.postMessage(results);
};

function serializeElement(element, indentLevel) {
	const indent = "    ".repeat(indentLevel);
	let xml = `${indent}<${element.tag}>`;
	if (element.content.includes("<")) {
		xml += `\n${element.content}\n${indent}`;
	} else {
		xml += `${element.content}`;
	}
	xml += `</${element.tag}>`;
	return xml;
}
