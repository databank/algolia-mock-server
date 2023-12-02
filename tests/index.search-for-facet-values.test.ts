

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
				'filterOnly(filterOnlyAttribute)',
				'afterDistinct(afterDistinctAttribute)',

				// must be searchable to be able to search for facet values
				'searchable(attribute)',
				'searchable(nested.attribute)',
				'searchable(booleanAttribute)',
				'searchable(numberAttribute)',
				
				

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

		try {
			await adminIndex.searchForFacetValues("filterOnlyAttribute", "");
		} catch (err:any) {
			expect(err.name).toBe("ApiError")
		}

		try {
			await adminIndex.searchForFacetValues("afterDistinctAttribute", "");
		} catch (err:any) {
			expect(err.name).toBe("ApiError")
		}


		const attribute_response = await adminIndex.searchForFacetValues("attribute", "");
		expect(attribute_response.facetHits.pop()).toStrictEqual({
			value: "a1",
			highlighted: "a1",
			count: 1
		})

		// nested not working for now
		// const nestedAttribute_response = await adminIndex.searchForFacetValues("nested.attribute", "");
		// expect(nestedAttribute_response.facetHits.pop()).toStrictEqual({
		// 	value: "na1",
		// 	highlighted: "na1",
		// 	count: 1
		// })

		const booleanAttribute_response = await adminIndex.searchForFacetValues("booleanAttribute", "");
		expect(booleanAttribute_response.facetHits.pop()).toStrictEqual({
			value: "true",
			highlighted: "true",
			count: 1
		})


		const numberAttribute_response = await adminIndex.searchForFacetValues("numberAttribute", "");
		expect(numberAttribute_response.facetHits.pop()).toStrictEqual({
			value: "1",
			highlighted: "1",
			count: 1
		})




		// @todo: 
		//    can it be filterOnly and searchable ?
		//    can it be distinct and searchable ?

		await adminIndex.delete()
	});


})