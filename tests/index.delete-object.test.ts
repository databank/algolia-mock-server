

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

describe("index.deleteObject()", () => {
	test('delete existing object', async () => {
		const index = client.initIndex('test-delete-object');
		await index.saveObject({
			objectID: "delete_item_1",
		}).wait()
		await index.deleteObject('delete_item_1').wait();

		try {
			await index.getObject("delete_item_1")
			throw new Error("ObjectID is not supposed to exist")
		} catch (e:any) {
			expect(e.message).toBe("ObjectID does not exist")
		}

		await index.delete()
	});
})