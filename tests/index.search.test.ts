

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


describe("index.search()", () => {
	let adminIndex:any;
	beforeAll(async () => {
		adminIndex = adminClient.initIndex('test-search');
		await adminIndex.saveObjects([
			{
				objectID: "search1", 
				att1: 1, 
				att2: 2, 
				att3: 3, 
				text1: "hello world",
				author: {
					name: "James Bond",
				}
			},
			{
				objectID: "search2", 
				att1: 1, 
				att2: 2, 
				att3: 3, 
				text1: "hey world",
				authors: [
					null,
					{
						name: "James Doe",
					},
				],
			},
			{objectID: "search3", att1: 1, att2: 2, att3: 3,},
		]).wait()
	});
	afterAll(async () => {
		await adminIndex.delete()
	});
	test('default params', async () => {
		const response = await adminIndex.search("");
		expect( response.nbHits ).toBe(3)
	});

	test('attributesToRetrieve', async () => {
		let response; 
		let firstResult;
		
		response = await adminIndex.search("", {attributesToRetrieve: ['att1', 'att3'],});
		firstResult =  response.hits.shift();
		expect(firstResult.objectID).toBeDefined()
		expect(firstResult.att1).toBe(1)
		expect(firstResult.att2).toBeUndefined()

		await adminIndex.setSettings({attributesToRetrieve: ["att1", "att3"],}).wait()

		response = await adminIndex.search("", {});
		firstResult =  response.hits.shift()
		expect(firstResult.objectID).toBeDefined()
		expect(firstResult.att1).toBe(1)
		expect(firstResult.att2).toBeUndefined()

	});

	test('unretrievableAttributes', async () => {
		const index = client.initIndex('test-search-unretrievableAttributes');
		const adminIndex = adminClient.initIndex('test-search-unretrievableAttributes');

		await adminIndex.setSettings({unretrievableAttributes: ["unretrievable1","unretrievable2"],}).wait()

		await adminIndex.saveObject({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			unretrievable1: true,
			unretrievable2: true,
		}).wait()

		const response = await index.search("", {
			attributesToRetrieve: ["retrievable1","retrievable2","unretrievable1","unretrievable2"],
		});
		let [ hit1 ]: any[] = response.hits;
		delete hit1._highlightResult;

		expect(hit1).toStrictEqual({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
		})

		const response2 = await adminIndex.search("", {});
		let [ hit2 ]: any[] = response2.hits;
		delete hit2._highlightResult;

		expect(hit2).toStrictEqual({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			unretrievable1: true,
			unretrievable2: true,
		})

		await adminIndex.delete()
	});
	test('page,hitsPerPage', async () => {
		const adminIndex = adminClient.initIndex('test-search-paging');

		let objects = new Array(30).fill(null).map((el,idx,arr)=> ({
			"objectID": `obj_${idx}`,
		}))
		await adminIndex.saveObjects(objects).wait()

		const response = await adminIndex.search("", {});
		expect( response.hits.length ).toBe(20);
		expect( response.page ).toBe(0)
		expect( response.nbHits ).toBe(30);
		expect( response.nbPages ).toBe(2);
		expect( response.hitsPerPage ).toBe( 20 ) // default


		const response2 = await adminIndex.search("", {hitsPerPage: 3,});
		expect( response2.hits.length ).toBe(3);
		expect( response2.page ).toBe(0)
		expect( response2.nbHits ).toBe(30);
		expect( response2.nbPages ).toBe(10);
		expect( response2.hitsPerPage ).toBe( 3 )


		const response3 = await adminIndex.search("", {hitsPerPage: 30,});
		expect( response3.hits.length ).toBe(30);
		expect( response3.page ).toBe(0)
		expect( response3.nbHits ).toBe(30);
		expect( response3.nbPages ).toBe(1);
		expect( response3.hitsPerPage ).toBe( 30 )


		const response4 = await adminIndex.search("", {hitsPerPage: 50,});
		expect( response4.hits.length ).toBe(30);
		expect( response4.page ).toBe(0)
		expect( response4.nbHits ).toBe(30);
		expect( response4.nbPages ).toBe(1);
		expect( response4.hitsPerPage ).toBe( 50 )



		// page out of bonds
		const response5 = await adminIndex.search("", {hitsPerPage: 30, page: 3});
		expect( response5.hits.length ).toBe(0);
		expect( response5.page ).toBe(3)
		expect( response5.nbHits ).toBe(30);
		expect( response5.nbPages ).toBe(1);
		expect( response5.hitsPerPage ).toBe( 30 )
		// console.log( JSON.stringify(response5, null, "\t") );

		adminIndex.delete()
	})
	test('query', async () => {

		await adminIndex.setSettings({attributesToRetrieve: null,}).wait()

		const response1 = await adminIndex.search("world", {getRankingInfo: true});
		expect( response1.hits.length ).toBe(2);

		const response2 = await adminIndex.search("hello world", {getRankingInfo: true});
		expect( response2.hits.length ).toBe(1);
		//console.log("response2",JSON.stringify(response2, null, "\t"))


		const response3 = await adminIndex.search("world hello", {getRankingInfo: true});
		expect( response3.hits.length ).toBe(1);
		//console.log("response3",JSON.stringify(response3, null, "\t"))


		// all words must be found
		const response4 = await adminIndex.search("world hello hey", {getRankingInfo: true});
		expect( response4.hits.length ).toBe(0);

		// words in different attributes, att1: hello, att2: hey, are not returned
		const response5 = await adminIndex.search("hey hello", {getRankingInfo: true});
		expect( response5.hits.length ).toBe(0);
		//console.log("response5",JSON.stringify(response5, null, "\t"))


		// search in nested array and object
		const response6 = await adminIndex.search("james", {getRankingInfo: true});
		expect( response6.hits.length ).toBe(2);
		//console.log("response6",JSON.stringify(response6, null, "\t"))


		const response7 = await adminIndex.search("james bond", {getRankingInfo: true});
		expect( response7.hits.length ).toBe(1);
		//console.log("response7",JSON.stringify(response7, null, "\t"))


		// expect(firstResult.objectID).toBeDefined()
		// expect(firstResult.att1).toBe(1)
		// expect(firstResult.att2).toBeUndefined()

		// await adminIndex.setSettings({attributesToRetrieve: ["att1", "att3"],}).wait()

		// response = await adminIndex.search("", {});
		// firstResult =  response.hits.shift()
		// expect(firstResult.objectID).toBeDefined()
		// expect(firstResult.att1).toBe(1)
		// expect(firstResult.att2).toBeUndefined()

	});

	test('facetFilters, facets', async () => {

		const index = adminClient.initIndex('test-search-facetFilters');

		await index.setSettings({attributesForFaceting: [
			'att1',
			'author.name',
			'authors.name',
			'this.is.sparta',
			'nulled',
			'bool',
			'number',
			' filterOnly ( attribute3 ) ',
			' afterDistinct ( searchable ( attribute5 ) ) ',
		],}).wait()

		await index.saveObjects([
			{
				objectID: "search1",
				inexistentAttribute: "whatever",
				att1: "hello",
				authors: [
					{
						name: "James",
					},
					{
						name: "Bond",
					},
					{
						name: "Bond", // Algolia will count "Bond" only once
					},
					{
						name: "BonD", // test Algolia facet value case behavior
					},
					{
						name: "0.0.7",
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
				},
				authors: [
					{
						name: "BonD", // will it count into Bond ?
					}
				]
			},
		]).wait()






		/*
			if attribute is not defined in attributesForFaceting
			it should just not match the filter
		*/
		const response1 = await index.search("", {
			facetFilters: [
				"inexistentAttribute:whatever"
			]
		});
		expect( response1.hits.length ).toBe(0);



		/*
			if attribute is defined in attributesForFaceting
			it should attempt to match it case insensitive
			no match in this case
		*/
		const response2 = await index.search("", {
			facetFilters: [
				"att1:whatever"
			]
		});
		expect( response2.hits.length ).toBe(0);







		/*
			if attribute is defined in attributesForFaceting
			it should attempt to match it case insensitive
			should match 1
		*/
		const response3 = await index.search("", {
			facetFilters: [
				"att1:hElLo"
			]
		});
		expect( response3.hits.length ).toBe(1);









		/*
			nested author.name
		*/
		const response4 = await index.search("", {
			facetFilters: [
				"author.name:jameS"
			]
		});
		expect( response4.hits.length ).toBe(1);






		/*
			nested authors.name in array
		*/
		const response5 = await index.search("", {
			facetFilters: [
				"authors.name:doe"
			]
		});
		expect( response5.hits.length ).toBe(0);
		const response6 = await index.search("", {
			facetFilters: [
				"authors.name:bonD"
			]
		});
		expect( response6.hits.length ).toBe(2);



		/*
			"k1:v1" AND "k2:v2"
		*/
		const response7 = await index.search("", {
			facetFilters: [
				"authors.name:james",
				"att1:hello"
			]
		});

		expect( response7.hits.length ).toBe(1);








		/*
			true AND [ true ]
		*/
		const response8 = await index.search("", {
			facetFilters: [
				"authors.name:james",
				["att1:hello"]
			]
		});
		expect( response8.hits.length ).toBe(1);




		/*
			true AND [ true OR true ]
		*/
		const response9 = await index.search("", {
			facetFilters: [
				["authors.name:james", "authors.name:bond"],
			]
		});
		expect( response9.hits.length ).toBe(2);


		/*
			nasty nesting
		*/
		const response10 = await index.search("", {
			facetFilters: [
				["this.is.sparta:yey"],
			]
		});
		expect( response10.hits.length ).toBe(1);


		/*
			test against boolean
		*/
		const response11 = await index.search("", {
			facetFilters: [
				["bool:true"],
			]
		});
		expect( response11.hits.length ).toBe(1);



		/*
			test against number
		*/
		const response12 = await index.search("", {
			facetFilters: [
				["number:1"],
			]
		});
		expect( response12.hits.length ).toBe(1);




		/*

		*/
		const response14:any = await index.search("", {
			facets: [
				'att1',
				'author.name',
				'authors.name',
				'this.is.sparta',
				'nulled',
				'bool',
				'number',
				'attribute3', // filterOnly
				'attribute5', // searchable, afterDistinct
			],
		});

		const bondFacetName = response14.facets["authors.name"].Bond || response14.facets["authors.name"].BonD;
		expect( response14.facets.att1.hello ).toBe(1);             // simple string
		expect( response14.facets.bool.true ).toBe(1);              // boolean
		expect( response14.facets.number["1"] ).toBe(1);            // number
		expect( response14.facets["author.name"].James ).toBe(1);   // nested object
		expect( response14.facets["this.is.sparta"].yey ).toBe(1);  // more complex case with object in array
		expect( bondFacetName).toBe(2);                             // nested array


		expect( response14.facets.nulled ).toBeUndefined()          // null should not be faceted

		index.delete()

	})
})