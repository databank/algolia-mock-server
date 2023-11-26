
/*
	https://www.algolia.com/doc/rest-api/search/#clear-objects

*/

import { defaultHeaders } from "../../constants";

export const clearObjectsRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/clear$/

export const clearObjects = async (storage:any, { indexName }: any ) => {
	//console.log("clearObjects", indexName );
	
	// @todo:
	// check index -> 400: Invalid indexName

	try {
		await storage.deleteAllObjects( indexName );
	} catch (err:any) {
		return {
			statusCode: 500, 
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": err.message,
				"status": 500,
			})
		}
	}

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			"updatedAt": new Date().toISOString(),
			"taskID": new Date().getTime(),
		}),
	}
}
	