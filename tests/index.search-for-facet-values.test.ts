

import { createServer, } from 'http';
import algoliasearch from 'algoliasearch';

import { httpHandler, mockStorageMemory } from '../src/index';

const storage = mockStorageMemory();

const server = createServer(httpHandler(storage));

const adminClient = algoliasearch( process.env.ALGOLIA_APPLICATION_ID || '', process.env.ALGOLIA_SECRET || 'ADMINKEY', {
	hosts: [{ url: process.env.ALGOLIA_ENDPOINT || 'localhost:3000', protocol: process.env.ALGOLIA_PROTOCOL || 'http', }],
});

const client = algoliasearch( process.env.ALGOLIA_APPLICATION_ID || '', process.env.ALGOLIA_READONLY_KEY || 'READKEY', {
	hosts: [{ url: process.env.ALGOLIA_ENDPOINT || 'localhost:3000', protocol: process.env.ALGOLIA_PROTOCOL || 'http', }],
});

beforeAll(() => server.listen(3000));
afterAll(() => server.close());


describe("index.searchForFacetValues()", () => {
	test('facetName', async () => {
		const adminIndex = adminClient.initIndex('test-searchForFacetValues-1');
		await adminIndex.setSettings({
			attributesForFaceting: [
				'attribute',
				'nested.attribute',
				'booleanAttribute',
				'numberAttribute',
				'filterOnly(filterOnlyAttribute)',
				'afterDistinct(afterDistinctAttribute)',
				'searchable (searchableAttribute)',
			]
		}).wait()
		await adminIndex.saveObjects([{
			objectID: "obj1",
			attribute: "a1",
			nested: {
				attribute: "na1"
			},
			booleanAttribute: true,
			numberAttribute: 1,
			filterOnlyAttribute: "foa",
			afterDistinctAttribute: "ad1",
			searchableAttribute: "sa1",
		}]).wait()

		const inexistent_attribute_response = adminIndex.searchForFacetValues("inexistent", "");
		console.log(JSON.stringify({inexistent_attribute_response}, null, "\t"))


		const attribute1_response = await adminIndex.searchForFacetValues("attribute1", "");
		console.log(JSON.stringify({attribute1_response}, null, "\t"))

		const nestedAttribute_response = await adminIndex.searchForFacetValues("nested.attribute", "");
		console.log(JSON.stringify({nestedAttribute_response}, null, "\t"))

		const booleanAttribute_response = await adminIndex.searchForFacetValues("booleanAttribute", "");
		console.log(JSON.stringify({booleanAttribute_response}, null, "\t"))

		const numberAttribute_response = await adminIndex.searchForFacetValues("numberAttribute", "");
		console.log(JSON.stringify({numberAttribute_response}, null, "\t"))

		const filterOnlyAttribute_response = await adminIndex.searchForFacetValues("filterOnlyAttribute", "");
		console.log(JSON.stringify({filterOnlyAttribute_response}, null, "\t"))

		const afterDistinctAttribute_response = await adminIndex.searchForFacetValues("afterDistinctAttribute", "");
		console.log(JSON.stringify({afterDistinctAttribute_response}, null, "\t"))

		const searchableAttribute_response = await adminIndex.searchForFacetValues("searchableAttribute", "");
		console.log(JSON.stringify({searchableAttribute_response}, null, "\t"))

		await adminIndex.delete()
	});


})