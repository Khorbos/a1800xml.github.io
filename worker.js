importScripts("https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js");
/* Simple API for XML */
self.onmessage = function (e) {
    const { xmlString, searchText } = e.data;
    const parser = sax.parser(true);
    const results = [];
    let currentTag = null;
    let currentContent = "";
    let stack = [];
    let isMatchingGUID = false;

    /* Definition of parserOptions */
    parser.onopentag = node => {
        currentTag = node.name;
        stack.push({ tag: node.name, content: "", children: [] });
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

        if (currentContent.includes(searchText)) {
            isMatchingGUID = true;
        }

        if (isMatchingGUID) {
            if (tagName === "GUID") {
                // Push the parent element (2 levels up) when matching the GUID
                if (stack.length > 1) {
                    results.push(stack[stack.length - 1]);
                } else {
                    results.push(element);
                }
                isMatchingGUID = false; // Reset the flag after finding and pushing the result
            }
        }

        currentTag = null;
        currentContent = "";
    };
    /* End of parser Definitions */

    parser.write(xmlString).close(); // Execute the parser
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
