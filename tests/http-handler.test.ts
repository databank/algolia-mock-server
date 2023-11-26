

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





// @todo: saveObjects

// getObjects?










describe("clearObjects", () => {
	test('clearObjects', async () => {

		jest.setTimeout(60000);

		const index = client.initIndex('test-clear-index');
		await index.saveObjects([
			{objectID: "clear_item_1",},
			{objectID: "clear_item_2",},
			{objectID: "clear_item_3",},
		]).wait()

		const obj = await index.getObject("clear_item_2");
		expect(obj).toStrictEqual({objectID: "clear_item_2"})

		await index.clearObjects().wait();

		try {
			await index.getObject("clear_item_2");
			throw new Error("ObjectID is not supposed to exist")
		} catch (e:any) {
			expect(e.message).toBe("ObjectID does not exist")
		}

		await index.delete()
	});
})


/*
client.multipleGetObjects(array multipleObjects, {
  // Any other requestOptions
})
*/