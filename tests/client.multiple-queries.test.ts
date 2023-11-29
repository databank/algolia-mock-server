

import { createServer, } from 'http';
import algoliasearch from 'algoliasearch';

import { httpHandler, mockStorageMemory } from '../src/index';
import { defaultIndexSettings } from "../src/constants";

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


describe("client.multipleQueries", () => {
	let index1:any;
	let index2:any;

	beforeAll(async () => {
		index1 = adminClient.initIndex('test-multiple-queries-index1');
		await index1.saveObjects([
			{objectID: "search1", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
			{objectID: "search2", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
			{objectID: "search3", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
		]).wait()

		index2 = adminClient.initIndex('test-multiple-queries-index2');
		await index2.saveObjects([
			{objectID: "search1", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
			{objectID: "search2", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
			{objectID: "search3", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
		]).wait()
	});

	afterAll(async () => {
		await index1.delete()
		await index2.delete()
	});

	test('default parameters', async () => {
		const queries = [
			{
				indexName: 'test-multiple-queries-index1',
			},
			{
				indexName: 'test-multiple-queries-index2',
			},
		];
		const response:any = await adminClient.multipleQueries(queries);
		expect(response.results.length).toBe(2);
	})

	test('attributesToRetrieve', async () => {
		const queries = [
			{
				indexName: 'test-multiple-queries-index1',
				params: {
					attributesToRetrieve: ['att1','att3']
				},
			},
			{
				indexName: 'test-multiple-queries-index2',
				params: {
					attributesToRetrieve: ['att1','att3']
				},
			},
		];
		const response1:any = await adminClient.multipleQueries(queries);
		expect(response1.results.length ).toBe(2);
		const firstResult1 =  response1.results[0].hits.shift();
		expect(firstResult1.objectID).toBeDefined()
		expect(firstResult1.att1).toBe(1)
		expect(firstResult1.att2).toBeUndefined()

		await index2.setSettings({attributesToRetrieve: ["att1", "att3"],}).wait()

		const response2:any = await adminClient.multipleQueries(queries);
		const firstResult2 = response2.results[1].hits.shift()
		expect(firstResult2.objectID).toBeDefined()
		expect(firstResult2.att1).toBe(1)
		expect(firstResult2.att2).toBeUndefined()
	})


	test('unretrievableAttributes', async () => {
		await index1.setSettings({unretrievableAttributes: ["unretrievable1","unretrievable2"],}).wait()
		await index2.setSettings({unretrievableAttributes: ["unretrievable1","unretrievable2"],}).wait()

		const queries = [
			{
				indexName: 'test-multiple-queries-index1',
			},
			{
				indexName: 'test-multiple-queries-index2',
			},
		];
		const response1:any = await adminClient.multipleQueries(queries);
		let [ hit1 ] = response1.results[0].hits;
		delete hit1._highlightResult;

		expect(hit1.unretrievable1).toBe(1);

		const response2:any = await client.multipleQueries(queries);
		let [ hit2 ] = response2.results[0].hits;
		delete hit2._highlightResult;

		expect(hit2.unretrievable1).toBeUndefined();
	})

	test('page,hitsPerPage', async () => {

		const adminIndex = adminClient.initIndex('test-multiple-queries-paging');

		let objects = new Array(30).fill(null).map((el,idx,arr)=> ({
			"objectID": `obj_${idx}`,
		}))
		await adminIndex.saveObjects(objects).wait()

		const queries = [
			{
				indexName: 'test-multiple-queries-paging',
			},
			{
				indexName: 'test-multiple-queries-paging',
				params: {
					hitsPerPage: 3,
				},
			},
			{
				indexName: 'test-multiple-queries-paging',
				params: {
					hitsPerPage: 30,
				},
			},
			{
				indexName: 'test-multiple-queries-paging',
				params: {
					hitsPerPage: 50,
				},
			},
			{
				indexName: 'test-multiple-queries-paging',
				params: {
					page: 3,
					hitsPerPage: 30,
				},
			}
		];

		const response1:any = await adminClient.multipleQueries(queries);
		expect( response1.results[0].hits.length ).toBe(20);
		expect( response1.results[0].page ).toBe(0)
		expect( response1.results[0].nbHits ).toBe(30);
		expect( response1.results[0].nbPages ).toBe(2);
		expect( response1.results[0].hitsPerPage ).toBe( 20 ) // default


		expect( response1.results[1].hits.length ).toBe(3);
		expect( response1.results[1].page ).toBe(0)
		expect( response1.results[1].nbHits ).toBe(30);
		expect( response1.results[1].nbPages ).toBe(10);
		expect( response1.results[1].hitsPerPage ).toBe( 3 )



		expect( response1.results[2].hits.length ).toBe(30);
		expect( response1.results[2].page ).toBe(0)
		expect( response1.results[2].nbHits ).toBe(30);
		expect( response1.results[2].nbPages ).toBe(1);
		expect( response1.results[2].hitsPerPage ).toBe( 30 )


		expect( response1.results[3].hits.length ).toBe(30);
		expect( response1.results[3].page ).toBe(0)
		expect( response1.results[3].nbHits ).toBe(30);
		expect( response1.results[3].nbPages ).toBe(1);
		expect( response1.results[3].hitsPerPage ).toBe( 50 )



		// // page out of bonds
		expect( response1.results[4].hits.length ).toBe(0);
		expect( response1.results[4].page ).toBe(3)
		expect( response1.results[4].nbHits ).toBe(30);
		expect( response1.results[4].nbPages ).toBe(1);
		expect( response1.results[4].hitsPerPage ).toBe( 30 )
		// // console.log( JSON.stringify(response5, null, "\t") );

		adminIndex.delete()
	})


	test('query', async () => {
		const index = adminClient.initIndex('test-multiple-queries-querytext-index1');
		await index.saveObjects([
			{objectID: "search1", text1: "hello world",
			author: {
				name: "James Bond",
			} },
			{objectID: "search2", text1: "hey world",
			authors: [
				null,
				{
					name: "James Doe",
				},
			], },
			{objectID: "search3", att1: 1, att2: 2, att3: 3, unretrievable1: 1, unretrievable2: 2, },
		]).wait()

		const response1:any = await adminClient.multipleQueries([{ query: "world", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response1.results[0].hits.length ).toBe(2);
		//console.log("response1",JSON.stringify(response1, null, "\t"))


		const response2:any = await adminClient.multipleQueries([{ query: "hello world", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response2.results[0].hits.length ).toBe(1);
		//console.log("response2",JSON.stringify(response2, null, "\t"))

		const response3:any = await adminClient.multipleQueries([{ query: "world hello", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response3.results[0].hits.length ).toBe(1);
		//console.log("response3",JSON.stringify(response3, null, "\t"))


		// all words must be found
		const response4:any = await adminClient.multipleQueries([{ query: "world hello hey", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response4.results[0].hits.length ).toBe(0);

		// words in different attributes, att1: hello, att2: hey, are not returned
		const response5:any = await adminClient.multipleQueries([{ query: "hey hello", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response5.results[0].hits.length ).toBe(0);
		//console.log("response5",JSON.stringify(response5, null, "\t"))

		// search in nested array and object
		const response6:any = await adminClient.multipleQueries([{ query: "james", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response6.results[0].hits.length ).toBe(2);
		//console.log("response6",JSON.stringify(response6, null, "\t"))

		const response7:any = await adminClient.multipleQueries([{ query: "james bond", indexName: 'test-multiple-queries-querytext-index1', },]);
		expect( response7.results[0].hits.length ).toBe(1);
		//console.log("response7",JSON.stringify(response7, null, "\t"))

		index.delete()
	})



	test('facetFilters', async () => {
		const indexName = 'test-multiple-queries-facetFilters'
		const index = adminClient.initIndex(indexName);
		await index.setSettings({
			attributesForFaceting: [
				'att1',
				'author.name',
				'authors.name',
				'this.is.sparta',
				'nulled',
				'bool',
				'number',
				' filterOnly ( attribute3 ) ',
				' afterDistinct ( searchable ( attribute5 ) ) ',
			],
		}).wait()

		await index.saveObjects([
			{
				objectID: "search1",
				inexistentFacet: "whatever",
				att1: "hello",
				authors: [
					{
						name: "James",
					},
					{
						name: "Bond",
					},
				],

			},
			{
				objectID: "search2",
				nulled: null,
				bool: true,
				number: 1,
				author: {
					name: "James",
				},
				this: {
					is:[ 
						{
							sparta: "yey",
						}
					]
				}
			},
		]).wait()


		const queries = [
			/*
				if attribute is not defined in attributesForFaceting
				it should just not match the filter
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"inexistentFacet:whatever"
					]
				}
			},
			/*
				if attribute is defined in attributesForFaceting
				it should attempt to match it case insensitive
				no match in this case
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"att1:whatever"
					]
				}
			},
			/*
				if attribute is defined in attributesForFaceting
				it should attempt to match it case insensitive
				should match 1
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"att1:hElLo"
					]
				}
			},
			
			/*
				nested author.name
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"author.name:jameS"
					]
				}
			},
			/*
				nested authors.name in array
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"authors.name:doe"
					]
				}
			},
			{
				indexName,
				params: {
					facetFilters: [
						"authors.name:bonD"
					]
				}
			},

			/*
				"k1:v1" AND "k2:v2"
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"authors.name:james",
						"att1:hello"
					]
				}
			},
			/*
				true AND [ true ]
			*/
			{
				indexName,
				params: {
					facetFilters: [
						"authors.name:james",
						["att1:hello"]
					]
				}
			},


			/*
				true AND [ true OR true ]
			*/
			{
				indexName,
				params: {
					facetFilters: [
						["authors.name:james", "authors.name:bond"],
					]
				}
			},


			/*
				nasty nesting
			*/
			{
				indexName,
				params: {
					facetFilters: [
						["this.is.sparta:yey"],
					]
				}
			},

			/*
				test against boolean
			*/
			{
				indexName,
				params: {
					facetFilters: [
						["bool:true"],
					]
				}
			},
			/*
				test against number
			*/
			{
				indexName,
				params: {
					facetFilters: [
						["number:1"],
					]
				}
			},

			/*
				facets
			*/
			{
				indexName,
				params: {
					facets: [
						'att1',
						'author.name',
						'authors.name',
						'this.is.sparta',
						'nulled',
						'bool',
						'number',
						' filterOnly ( attribute3 ) ',
						' afterDistinct ( searchable ( attribute5 ) ) ',
					]
				}
			},

		];

		const response:any = await adminClient.multipleQueries(queries);
		expect( response.results[0].hits.length ).toBe(0);
		expect( response.results[1].hits.length ).toBe(0);
		expect( response.results[2].hits.length ).toBe(1);
		expect( response.results[3].hits.length ).toBe(1);
		expect( response.results[4].hits.length ).toBe(0);
		expect( response.results[5].hits.length ).toBe(1);
		expect( response.results[6].hits.length ).toBe(1);
		expect( response.results[7].hits.length ).toBe(1);
		expect( response.results[8].hits.length ).toBe(1);
		expect( response.results[9].hits.length ).toBe(1);
		expect( response.results[10].hits.length ).toBe(1);
		expect( response.results[11].hits.length ).toBe(1);

		const { facets } = response.results[12];

		expect( facets.att1.hello ).toBe(1);             // simple string
		expect( facets.bool.true ).toBe(1);              // boolean
		expect( facets.number["1"] ).toBe(1);            // number
		expect( facets["author.name"].James ).toBe(1);   // nested object
		expect( facets["this.is.sparta"].yey ).toBe(1);  // more complex case with object in array

		//console.log(JSON.stringify({ facets }, null, "\t"))
	})

	test('distinct, attributeForDistinct', async () => {
		const indexName = 'test-multiple-queries-distinct';
		const index = adminClient.initIndex(indexName);

		await index.setSettings({
			distinct: 1,
			attributeForDistinct: "text",
		}).wait()

		await index.saveObjects([
			{
				objectID: "notext1",
			},
			{
				objectID: "hello1",
				text: "hello",
				nested: {
					text: "hello",
				}
			},
			{
				objectID: "world",
				text: "world",
				nested: {
					text: "world",
				}
			},
			{
				objectID: "hello2",
				text: "hello",
				nested: {
					text: "hello",
				}
			},
			{
				objectID: "notext2",
			},
		]).wait()


		const queries = [
			{
				indexName,
				params: {
				}
			},
			{
				indexName,
				params: {
					distinct: true
				}
			},
			{
				indexName,
				params: {
					distinct: false
				}
			},
			{
				indexName,
				params: {
				}
			},
		]

		const response:any = await adminClient.multipleQueries(queries);

		expect( response.results[0].hits.length).toBe(4)
		expect( response.results[1].hits.length).toBe(4)
		expect( response.results[2].hits.length).toBe(5)

		await index.setSettings({
			attributeForDistinct: "nested.text",
		}).wait()
		const response2:any = await adminClient.multipleQueries(queries);


		expect( response2.results[3].hits.length).toBe(4)
		index.delete()
	})


	// @todo: test multipleQueries on inexistent index

})