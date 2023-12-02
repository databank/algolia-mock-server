
/*
	https://www.algolia.com/doc/api-reference/api-methods/search-for-facet-values/
	https://www.algolia.com/doc/rest-api/search/#search-for-facet-values

	[ ] index settings
		[ ] attributesForFaceting
			[x] throw error if non-existent in attributesForFaceting
			[x] throw error if non-searcahble
			[ ] support nested
			[x] support boolean
			[x] support number

	[ ] parameters:
		[x] facetName
		[ ] facetQuery

	[ ] Response
		[ ] 404: Index indexName doesn’t exist
		[ ] 400: Cannot search in `<ATTRIBUTE>` attribute, you need to add `searchable(<ATTRIBUTE>)` to attributesForFaceting.
*/

//const querystring = require('node:querystring');

import { defaultHeaders } from "../../constants";
import { extractAttributesForFaceting } from "../utils";

export const searchForFacetValuesRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/facets\/(?<facetName>[^\/]+)\/query$/;

export const searchForFacetValues = async (storage:any, { indexName, facetName }: any, event:any ) => {
	const { qs, headers, body } = event;

	let response; 
	let results = []

	const payload = JSON.parse(body);
	//console.log ("body", body);
	
	// console.log("searchForFacetValues", JSON.stringify({
	// 	indexName, 
	// 	facetName, 
	// 	payload,
	// }, null, "\t"));

	const indexSettings = await storage.getIndex( indexName );
	const { 
		attributesForFaceting: attributesForFacetingRaw,
	} = indexSettings;

	const attributesForFaceting = extractAttributesForFaceting(attributesForFacetingRaw)
	//console.log(attributesForFaceting)

	if (!attributesForFaceting.hasOwnProperty(facetName))
		return {
			statusCode: 400,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": `Cannot search in \`${facetName}\` attribute, you need to add \`searchable(${facetName})\` to attributesForFaceting.`,
				"status": 400,
			})
		}

	if (!attributesForFaceting[facetName].searchable)
		return {
			statusCode: 400,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": `Cannot search in \`${facetName}\` attribute, you need to add \`searchable(${facetName})\` to attributesForFaceting.`,
				"status": 400,
			})
		}

	let objects = await storage.getAllObjects( indexName );

	// apply text filters ?

	// populate facets
	let facets:any = {}
	objects?.map((Item:any) => {
		Object.keys(attributesForFaceting).map( (facetName:any) => {
			const facetValue = Item[facetName];

			if (["string","boolean","number"].includes(typeof facetValue)) {

				if (!facets[facetName])
					facets[facetName] = {}

				if (!facets[facetName].hasOwnProperty(facetValue.toString())) {
					facets[facetName][facetValue.toString()] = 0;
				}
				
				facets[facetName][facetValue.toString()]++;
				return;
			}

			if (Array.isArray(facetValue)) {
				facetValue.map((facetValue:any) => {
					if (!facets[facetName])
						facets[facetName] = {}

					if (!facets[facetName].hasOwnProperty(facetValue)) {
						facets[facetName][facetValue] = 0;
					}

					facets[facetName][facetValue]++;
				})
			}
		})
	})

	let facetHits:any = [];
	if (facets[facetName]) {
		Object.keys(facets[facetName]).map(( facetValue ) => {
			facetHits.push({
				value: facetValue, 
				highlighted: facetValue, 
				count: facets[facetName][facetValue],
			})
		})
	}

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			facetHits,
			exhaustiveFacetCount: true,
		}),
	}
}