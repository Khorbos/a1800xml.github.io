importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/fast-xml-parser/4.4.1/fxparser.min.js');

const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    parseNodeValue: true,
    attributeNamePrefix: '',
    ignoreNameSpace: true
});

let indexedData = [];

self.onmessage = function(e) {
    if (e.data.action === 'indexFiles') {
        const files = e.data.files;
        let processedFiles = 0;

        files.forEach(file => {
            fetch(file)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    const decompressed = new TextDecoder("utf-8").decode(pako.ungzip(new Uint8Array(buffer)));
                    console.log(`Decompressed content for ${file}:`, decompressed);

                    try {
                        const jsonObj = parser.parse(decompressed);
                        console.log(`Parsed JSON for ${file}:`, jsonObj);

                        if (jsonObj && jsonObj.DataSet) {
                            const dataSets = Array.isArray(jsonObj.DataSet) ? jsonObj.DataSet : [jsonObj.DataSet];
                            dataSets.forEach(dataSet => {
                                if (dataSet.Item) {
                                    const items = Array.isArray(dataSet.Item) ? dataSet.Item : [dataSet.Item];
                                    items.forEach(item => {
                                        indexedData.push({
                                            guid: item.Id || '',
                                            name: item.Name || '',
                                            content: JSON.stringify(item) // Serialize item to a string
                                        });
                                    });
                                } else {
                                    console.warn(`No Item data found in ${file}`);
                                }
                            });
                        } else {
                            console.warn(`No DataSet data found in ${file}`);
                        }
                    } catch (error) {
                        console.error(`Error parsing XML from ${file}:`, error);
                    }

                    processedFiles++;
                    const progress = (processedFiles / files.length) * 100;
                    self.postMessage({ action: 'progress', progress });

                    if (processedFiles === files.length) {
                        console.log('Indexing complete. Indexed data:', indexedData);
                        self.postMessage({ action: 'indexComplete', index: indexedData });
                    }
                })
                .catch(error => {
                    console.error('Error processing file:', file, error);
                });
        });
    } else if (e.data.action === 'search') {
        const query = e.data.query.toLowerCase();
        const results = indexedData.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.content.toLowerCase().includes(query)
        );
        console.log(`Search results for query "${query}":`, results);
        self.postMessage({ action: 'searchResults', results });
    }
};
