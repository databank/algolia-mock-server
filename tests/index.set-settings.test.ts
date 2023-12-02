

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

const setSettingsIndexName = 'test-set-settings';

describe("setSettings", () => {
	let adminIndex:any;

	beforeAll(async () => {
		adminIndex = adminClient.initIndex(setSettingsIndexName);
		await adminIndex.saveObjects([{objectID: "search1", att1: 1, att2: 2, att3: 3,},]).wait()
	});

	test('hitsPerPage', async () => {
		await adminIndex.setSettings({hitsPerPage: 2,}).wait()
		const settings = await adminIndex.getSettings()	
		expect(settings.hitsPerPage).toBe(2)
	})
	test('attributesToRetrieve', async () => {
		let settings;

		await adminIndex.setSettings({attributesToRetrieve: ["att1", "att3"],}).wait()		
		settings = await adminIndex.getSettings()
		expect(settings.attributesToRetrieve).toStrictEqual([ 'att1', 'att3' ])

		await adminIndex.setSettings({attributesToRetrieve: null,}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.attributesToRetrieve).toBe(null)
	})

	test('unretrievableAttributes', async () => {
		let settings;

		await adminIndex.setSettings({unretrievableAttributes: ["att1", "att3"],}).wait()		
		settings = await adminIndex.getSettings()
		expect(settings.unretrievableAttributes).toStrictEqual([ 'att1', 'att3' ])

		await adminIndex.setSettings({unretrievableAttributes: null,}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.unretrievableAttributes).toBe(null)
	})

	test('searchableAttributes', async () => {
		let settings;

		await adminIndex.setSettings({
			searchableAttributes: [
				' attribute1 ',
				' attribute2, attribute3 ', // both attributes have the same priority
				' unordered( attribute4 ) '
			]
		}).wait()

		settings = await adminIndex.getSettings()

		expect(settings.searchableAttributes).toStrictEqual([
			// Algolia removes spaces, trims all attributes
			'attribute1',
			'attribute2,attribute3', // both attributes have the same priority, 
			'unordered( attribute4 )'
		])

		await adminIndex.setSettings({searchableAttributes: [],}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.searchableAttributes).toBe(null)
	})

	test('attributesForFaceting', async () => {
		let settings;
		await adminIndex.setSettings({
			attributesForFaceting: [
				' attribute1 ',
				' nested . attribute2 ',
				' filterOnly ( attribute3 ) ',
				' filterOnly ( attribute3 . subattribute ) ',
				' searchable ( attribute4 ) ',
				' searchable ( attribute4 . subattribute ) ',
				' afterDistinct ( attribute4 ) ',
				' afterDistinct ( attribute4 . subattribute ) ',
				' afterDistinct ( searchable ( attribute5 ) ) ',
				' afterDistinct ( searchable ( attribute5 . subattribute ) ) ',
			]
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.attributesForFaceting).toStrictEqual([
			' attribute1 ',
			' nested . attribute2 ',
			' filterOnly ( attribute3 ) ',
			' filterOnly ( attribute3 . subattribute ) ',
			' searchable ( attribute4 ) ',
			' searchable ( attribute4 . subattribute ) ',
			' afterDistinct ( attribute4 ) ',
			' afterDistinct ( attribute4 . subattribute ) ',
			' afterDistinct ( searchable ( attribute5 ) ) ',
			' afterDistinct ( searchable ( attribute5 . subattribute ) ) ',
		])
		//console.log(JSON.stringify(settings, null, "\t"));

		await adminIndex.setSettings({attributesForFaceting: [],}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.attributesForFaceting).toBe(null)
	})

	test('distinct, attributeForDistinct', async () => {
		let settings;

		await adminIndex.setSettings({
			distinct: true,
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.distinct).toBe(true)

		await adminIndex.setSettings({
			distinct: false,
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.distinct).toBe(false)

		await adminIndex.setSettings({
			distinct: 0,
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.distinct).toBe(false)



		await adminIndex.setSettings({
			distinct: 1,
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.distinct).toBe(true)



		await adminIndex.setSettings({
			distinct: 99,
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.distinct).toBe(99)

		await adminIndex.setSettings({
			distinct: false,
			attributeForDistinct: "myattribute"
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.attributeForDistinct).toBe("myattribute")

		await adminIndex.setSettings({
			distinct: false,
			attributeForDistinct: null
		}).wait()
		settings = await adminIndex.getSettings()
		expect(settings.attributeForDistinct).toBe(null)
	})

	test('replicas', async () => {
		const replicas = [
			'replica_index1',
			'replica_index2'
		]
		const searchableAttributes = ['attribute1,attribute2', 'attribute3',]
		await adminIndex.setSettings({
			replicas,
			// test if searchableAttributes is inherited by replica
			searchableAttributes,
			
		}).wait()

		const settings = await adminIndex.getSettings()
		expect(settings.replicas).toStrictEqual(replicas)
		expect(settings.searchableAttributes).toStrictEqual(searchableAttributes)


		const replicaIndex = adminClient.initIndex("replica_index1")
		const replicaSettings = await replicaIndex.getSettings()
		expect(replicaSettings.replicas).toBeUndefined()
		expect(replicaSettings.searchableAttributes).toBeNull()
		expect(replicaSettings.primary).toBe(setSettingsIndexName)


		// remove one replica and check replica settings after
		await adminIndex.setSettings({
			replicas: ["replica_index2"], // remove replica_index1
		}).wait()
		const indexSettings = await adminIndex.getSettings()
		const removedReplicaSettings = await replicaIndex.getSettings()
		expect(Array.isArray( indexSettings.replicas)).toBe(true)
		expect(indexSettings.replicas.includes("replica_index1")).toBe(false)

		console.log(JSON.stringify({ removedReplicaSettings}, null, "\t"))
		const indexResponse = await adminIndex.search("");
		const replicaResponse = await replicaIndex.search("");

		console.log(JSON.stringify({ indexResponse}, null, "\t"))
		console.log(JSON.stringify({ replicaResponse}, null, "\t"))


	})


	afterAll(async () => {
		await adminIndex.delete()
	});
})