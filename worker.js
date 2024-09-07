importScripts("https://cdn.jsdelivr.net/npm/sax@1.4.1/lib/sax.min.js");
/* Simple API for XML */

self.onmessage = function (e) {
	const { _XML, searchString, searchTag, parentTag, strict } = e.data;
	console.log("worker", _XML, searchString, searchTag, parentTag, strict);
};
