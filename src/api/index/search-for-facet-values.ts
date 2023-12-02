
/*
	https://www.algolia.com/doc/api-reference/api-methods/search-for-facet-values/

	[ ] index settings
			[x] attributesToRetrieve - index setting
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except
			[ ] unretrievableAttributes
			[ ] unretrievableAttributes - retrieve when authenticated with the admin API key

			[ ] test unretrievable nested

	[ ] parameters:
			// attributes
			[x] attributesToRetrieve - api parameter
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except


			[ ] getRankingInfo
*/

//const querystring = require('node:querystring');

import { defaultHeaders } from "../../constants";

export const searchForFacetValuesRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/facets\/(?<facetName>[^\/]+)\/query$/;

export const searchForFacetValues = async (storage:any, { indexName, facetName }: any, event:any ) => {
	const { qs, headers, body } = event;

	let response; 
	let results = []

	const payload = JSON.parse(body);
	console.log ("body", body);
	
	console.log("searchForFacetValues", JSON.stringify({
		indexName, 
		facetName, 
		payload,
	}, null, "\t"));

	const indexSettings = await storage.getIndex( indexName );
	const { 
		attributesForFaceting,
	} = indexSettings;


	let objects = await storage.getAllObjects( indexName );

	// apply filters

	// populate facets
	let facets:any = {}
	if (Array.isArray(attributesForFaceting)) {
		objects?.map((Item:any) => {
			attributesForFaceting.map( (facetName:any) => {
				if (typeof Item[facetName] === "string") {
					if (!facets[facetName])
						facets [facetName] = {}

					if (!facets[facetName].hasOwnProperty (Item[facetName])) {
						facets[facetName][Item[facetName]] = 0;
					}
					
					facets[facetName][Item[facetName]]++;
				}

				if (Array.isArray(Item[facetName])) {
					Item[facetName].map((facetValue:any) => {
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
	}

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