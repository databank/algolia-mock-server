

import { createServer, } from 'http';
import algoliasearch from 'algoliasearch';

import { httpHandler, mockStorageMemory } from '../src/index';
import { defaultIndexSettings } from "../src/constants";

const storage = mockStorageMemory();

const server = createServer(httpHandler(storage));

const client = algoliasearch( process.env.ALGOLIA_APPLICATION_ID || '', process.env.ALGOLIA_SECRET || '', {
	hosts: [{ url: process.env.ALGOLIA_ENDPOINT || 'localhost:3000', protocol: process.env.ALGOLIA_PROTOCOL || 'http', }],
});

beforeAll(() => server.listen(3000));
afterAll(() => server.close());

describe("index.deleteObjects()", () => {
	test('delete multiple objects', async () => {
		const index = client.initIndex('test-delete-objects');
		await index.saveObjects([
			{objectID: "delete_item_1",},
			{objectID: "delete_item_2",},
			{objectID: "delete_item_3",},
		]).wait()

		await index.deleteObjects(['delete_item_1','delete_item_3']).wait()

		const obj = await index.getObject("delete_item_2");
		expect(obj).toStrictEqual({objectID: "delete_item_2"})

		try {
			await index.getObject("delete_item_3");
			throw new Error("ObjectID is not supposed to exist")
		} catch (e:any) {
			expect(e.message).toBe("ObjectID does not exist")
		}

		await index.delete()
	});
})