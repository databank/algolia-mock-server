

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


describe("index.getObject()", () => {
	test('all attributes', async () => {
		const index = adminClient.initIndex('test-get-object-1');
		await index.saveObject({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			retrievable3: 3,
			unretrievable: true,
		}).wait()
		const obj = await index.getObject("test");
		expect(obj).toStrictEqual({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			retrievable3: 3,
			unretrievable: true,
		})

		await index.delete()
	});
	test('attributesToRetrieve', async () => {
		const index = adminClient.initIndex('test-get-object-2');
		await index.saveObject({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			retrievable3: 3,
			unretrievable: true,
		}).wait()

		const obj = await index.getObject("test", {
			attributesToRetrieve: ["retrievable1","retrievable3"],
		});
	
		expect(obj).toStrictEqual({
			objectID: "test",
			retrievable1: 1,
			retrievable3: 3,
		})

		await index.delete()
	});

	test('attributesToRetrieve index level', async () => {
		const index = adminClient.initIndex('test-get-object-2');
		await index.saveObject({
			objectID: "test",
			retrievable1: 1,
			retrievable2: 2,
			retrievable3: 3,
			unretrievable: true,
		}).wait()

		await index.setSettings({attributesToRetrieve: ["retrievable1", "retrievable3"],}).wait()
		const obj = await index.getObject("test", {});
	
		expect(obj).toStrictEqual({
			objectID: "test",
			retrievable1: 1,
			retrievable3: 3,
		})

		await index.delete()
	});

	test('unretrievableAttributes', async () => {
		const index = client.initIndex('test-get-object-unretrievableAttributes');
		const adminIndex = adminClient.initIndex('test-get-object-unretrievableAttributes');

		await adminIndex.saveObject({
			objectID: "test",
			retrievable: 1,
			unretrievable: 2,
		}).wait()

		await adminIndex.setSettings({unretrievableAttributes: ["unretrievable"],}).wait()
		const obj = await index.getObject("test", {});
		expect(obj).toStrictEqual({
			objectID: "test",
			retrievable: 1,
		})

		const obj2 = await adminIndex.getObject("test", {});
		expect(obj2).toStrictEqual({
			objectID: "test",
			retrievable: 1,
			unretrievable: 2, // if admin, unretrievableAttributes is retrievable
		})

		await adminIndex.delete()
	});

	//  do not apply to getObject
})