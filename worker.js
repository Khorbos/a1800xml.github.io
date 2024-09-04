importScripts('https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js');
self.onmessage = function(e) {
    const { xmlString, searchText } = e.data;
    const parser = sax.parser(true);
    const results = [];
    let currentTag = null;
    let currentContent = '';
    let stack = [];
    let isMatchingGUID = false;

    parser.onopentag = (node) => {
        currentTag = node.name;
        stack.push({ tag: node.name, content: '' });
    };

    parser.ontext = (text) => {
        if (currentTag) {
            currentContent += text.trim();
        }
    };

    parser.onclosetag = (tagName) => {
        const element = stack.pop();
        element.content = currentContent;

        if (tagName === 'GUID' && currentContent.includes(searchText)) {
            isMatchingGUID = true;
        }

        if (isMatchingGUID) {
            if (stack.length > 0) {
                stack[stack.length - 1].content += serializeElement(element, stack.length);
            }
            if (tagName === 'Text') {
                results.push(element);
                isMatchingGUID = false;
            }
        }

        currentTag = null;
        currentContent = '';
    };

    parser.write(xmlString).close();
    self.postMessage(results);
};

function serializeElement(element, indentLevel) {
    const indent = '    '.repeat(indentLevel);
    let xml = `${indent}<${element.tag}>`;
    if (element.content.includes('<')) {
        xml += `\n${element.content}\n${indent}`;
    } else {
        xml += `${element.content}`;
    }
    xml += `</${element.tag}>`;
    return xml;
}