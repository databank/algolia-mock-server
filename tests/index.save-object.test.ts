

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

describe("index.saveObject()", () => {
    test('saveObject()', async () => {
        const index = client.initIndex('test-save-object');
        try {
            await index.saveObject({
                objectID: "test",
                retrievable1: 1,
                retrievable2: 2,
                retrievable3: 3,
                unretrievable: true,
            }).wait()
        } catch (e:any) {
            console.log(e.transporterStackTrace);
        }
    
        await index.delete()
    });
})
