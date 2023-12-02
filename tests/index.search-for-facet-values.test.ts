

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
				//inexistent
				'non_searchable_attribute',

				// must be searchable to be able to search for facet values
				'searchable(attribute)',
				'searchable(nested.attribute)',
				'searchable(booleanAttribute)',
				'searchable(numberAttribute)',
				
				// 
				'filterOnly(filterOnlyAttribute)',
				'afterDistinct(afterDistinctAttribute)',
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

		try {
			await adminIndex.searchForFacetValues("inexistent", "");
		} catch (err:any) {
			expect(err.name).toBe("ApiError")
		}

		try {
			await adminIndex.searchForFacetValues("non_searchable_attribute", "");
		} catch (err:any) {
			expect(err.name).toBe("ApiError")
		}

		const attribute_response = await adminIndex.searchForFacetValues("attribute", "");
		console.log(JSON.stringify({attribute_response}, null, "\t"))

		const nestedAttribute_response = await adminIndex.searchForFacetValues("nested.attribute", "");
		console.log(JSON.stringify({nestedAttribute_response}, null, "\t"))

		const booleanAttribute_response = await adminIndex.searchForFacetValues("booleanAttribute", "");
		console.log(JSON.stringify({booleanAttribute_response}, null, "\t"))

		const numberAttribute_response = await adminIndex.searchForFacetValues("numberAttribute", "");
		console.log(JSON.stringify({numberAttribute_response}, null, "\t"))

		try {
			const filterOnlyAttribute_response = await adminIndex.searchForFacetValues("filterOnlyAttribute", "");
			console.log(JSON.stringify({filterOnlyAttribute_response}, null, "\t"))	
		} catch (err) {
			console.log(err)
		}

		try {
			const afterDistinctAttribute_response = await adminIndex.searchForFacetValues("afterDistinctAttribute", "");
			console.log(JSON.stringify({afterDistinctAttribute_response}, null, "\t"))	
		} catch (err) {
			console.log(err)
		}



		await adminIndex.delete()
	});


})