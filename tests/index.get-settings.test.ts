

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

describe("getSettings", () => {
	let index:any;

	beforeAll(async () => {
		index = client.initIndex('test-get-settings');
		await index.saveObjects([{objectID: "search1", att1: 1, att2: 2, att3: 3,},]).wait()
	});

	test('default parameters', async () => {

		const settings = await index.getSettings()
		expect(settings).toStrictEqual(defaultIndexSettings)
	})


	// @todo: test non-existing index

	// @todo: test replica

	afterAll(async () => {
		await index.delete()
	});
})