# algolia-server-mock


> :warning: **this package is work in progress** do not rely sole on it for unit testings!

![latest](https://github.com/databank/algolia-server-mock/actions/workflows/main.yml/badge.svg?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


algolia-mock-server is a personal effort to create an `algoliasearch` compatible
server counterpart that mimics the functionality of Algolia REST Api.

It is primarely ment for unit testing in TypeScript projects.

## Usage



### Install
```
npm install --save-dev @databank/algolia-mock-server
```

### Usage in unit tests
```

// Algolia client
import algoliasearch from 'algoliasearch';
// algolia-mock-server can distinguish between admin and read only credentials,
// and will fail writing to index if using read key, 
// and when using admin key it will retrieve unretrievable attributes

const mockWriteKey = "ADMINKEY"
const mockReadKey = "READKEY"
const client = algoliasearch('YourApplicationID', mockWriteKey , {
	hosts: [{ url: 'localhost:3000', protocol: 'http' }],
});

// algolia-server-mock
import { createServer, } from 'http';
import { httpHandler, mockStorageMemory } from '@databank/algolia-mock-server';

const storage = mockStorageMemory();
const server = createServer(httpHandler(storage));

beforeAll(() => server.listen(3000));
afterAll(() => server.close());

test('TestMyFunction', async () => {

	await myFunctionThatWritesToAlgolia();

	const index = client.initIndex('my_data_index');
	const algoliaObject = await index.getObject("test");

	expect( algoliaObject ).toStrictEqual( expectedObject )
})

```

## Coverage

### Algolia Client Coverage (npm `algoliasearch`)

- [x] `index.search()` - partial
- [x] `index.searchForFacetValues()` - partial
- [ ] `index.findObject()`
- [ ] `index.getObjectPosition()`
- [x] `index.getObject()`
- [x] `index.saveObject()`
- [x] `index.saveObjects()`
- [ ] `index.partialUpdateObject()`
- [ ] `index.partialUpdateObjects()`
- [ ] `index.replaceAllObjects()`
- [x] `index.deleteObject()`
- [x] `index.deleteObjects()`
- [ ] `index.deleteBy()`
- [x] `index.clearObjects()`
- [x] `index.batch()` - partial

- [ ] `index.saveSynonym()`
- [ ] `index.replaceAllSynonyms()`
- [ ] `index.deleteSynonym()`
- [ ] `index.clearSynonyms()`

- [ ] `index.saveRule()`
- [ ] `index.saveRules()`
- [ ] `index.replaceAllRules()`
- [ ] `index.deleteRule()`
- [ ] `index.clearRules()`

- [x] `index.getSettings()`
- [x] `index.setSettings()` - partial

- [x] `index.delete()`

- [x] `client.multipleQueries()` - partial
- [ ] `client.multipleGetObjects()`
- [ ] `client.moveIndex()`
- [ ] `client.copyIndex()`
- [ ] `client.copyRules()`
- [ ] `client.copySynonyms()`
- [ ] `client.copySettings()`
- [ ] `client.addApiKey()`
- [ ] `client.updateApiKey()`
- [ ] `client.deleteApiKey()`
- [ ] `client.multipleBatch()`


### REST API Coverage

- [ ] Index
  - [x] Get Settings
  - [x] Set Settings - partial
- [x] Search - partial
- [x] Search for facet values - partial
- [ ] Browse index
- [ ] Single object operations
  - [x] Get Object `index.getObject()`
    - [x] support for `attributesToRetrieve`
    - [ ] nested `attributesToRetrieve` eg. invoice.lines.*.name
    - [x] skip `unretrievableAttributes` - skipping nested attributes still in progress
  - [ ] Delete object
- [ ] Multi object operations
  - [ ] Add/Replace Object
  - [ ] Delete by Query
  - [x] Clear Objects used by `index.clearObjects()`
  - [ ] Partially update objects
  - [ ] Batch write operations
    - [ ] `addObject`
    - [x] `updateObject` used by `index.saveObject()` and `index.saveObjects()`
    - [ ] `partialUpdateObject`
    - [ ] `partialUpdateObjectNoCreate`
    - [x] `deleteObject` used by `index.deleteObject()` and `index.deleteObjects()`
    - [ ] `delete`
    - [ ] `clear`
  - [ ] Batch write operations - multiple indexes
  - [x] Get objects
- [ ] Multi index operations
	[x] Search multiple indexes - partial
     