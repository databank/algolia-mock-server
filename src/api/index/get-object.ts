
/*
	https://www.algolia.com/doc/rest-api/search/#get-object
	
		[ ] index level
			[x] attributesToRetrieve - index setting
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except

		[ ] parameter level
			[x] objectID is always retrieved
			[x] attributesToRetrieve - api parameter
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except
			[ ] check if case sensitive attributesToRetrieve
			[x] unretrievableAttributes - does not retrieve when using readKey
			[x] unretrievableAttributes - retrieve when authenticated with the admin API key
			[ ] unretrievableAttributes - support nested

*/


import { applyAttributesToRetrieve, applyUnretrievableAttributes } from "../utils";

import { defaultHeaders } from "../../constants";



export const getObjectRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/(?<objectID>.*)$/
export const getObject = async (storage:any, { indexName, objectID }: any, event:any ) => {

	const { qs,headers } = event;
	const { attributesToRetrieve } = qs
	const secret = headers["x-algolia-api-key"];

	// console.log("getObject", indexName, objectID, { attributesToRetrieve }); 

	const indexSettings = await storage.getIndex( indexName );
	const { 
		attributesToRetrieve: indexAttributesToRetrieve,
		unretrievableAttributes,
	} = indexSettings;


	try {
		// @ts-ignore
		let response = await storage.getObject(indexName, objectID );

		if (response === false ) {
			return {
				statusCode: 404,
				headers: {
					...defaultHeaders,
				},
				body: JSON.stringify({
					"message": "ObjectID does not exist",
					"status": 404,
				})
			}
		}

		if (attributesToRetrieve) {
			if (typeof attributesToRetrieve !== "string" )
				throw new Error("unexpected avalue for attributesToRetrieve");

			const clientAttributesToRetrieve = JSON.parse(attributesToRetrieve);
			return {
				statusCode: 200,
				headers: {
					...defaultHeaders,
				},
				body: JSON.stringify(applyAttributesToRetrieve(response, clientAttributesToRetrieve ))
			}
		}

		if (indexAttributesToRetrieve) {
			return {
				statusCode: 200,
				headers: {
					...defaultHeaders,
				},
				body: JSON.stringify(applyAttributesToRetrieve(response,indexAttributesToRetrieve ))
			}
		}

		// apply unretrievable attributes
		if (secret !== "ADMINKEY") {
			if (Array.isArray(unretrievableAttributes) && unretrievableAttributes.length ) {
				response = applyUnretrievableAttributes( response, unretrievableAttributes)
			}
		}

		return {
			statusCode: 200,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify(response)
		}

	} catch (err: any) {
		console.log(err)
		return {
			statusCode: 500,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": err.message,
				"status":  500,
			})
		}
	}




}