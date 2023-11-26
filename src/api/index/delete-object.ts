
/*
	https://www.algolia.com/doc/rest-api/search/#delete-object
	
		[x] 
*/

import { defaultHeaders } from "../../constants";

export const deleteObjectRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/(?<objectID>.*)$/
export const deleteObject = async (storage:unknown, { indexName, objectID }: any, event:any ) => {

	// console.log("deleteObject", indexName, objectID); 



	try {
		// @ts-ignore
		await storage.deleteObject(indexName, objectID );

		return {
			statusCode: 200,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"deletedAt": new Date().toISOString(),
				"taskID": new Date().getTime(),
			})
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