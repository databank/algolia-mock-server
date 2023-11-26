

/*
	https://www.algolia.com/doc/rest-api/search/#batch-write-operations
	[ ] addObject 
		- Add or replace an object
	[x] updateObject 
		- Add or replace an existing object. You must set the objectID attribute to indicate the object to update.
		[ ] objectID is required
		[ ] make sure has write rights
	[ ] partialUpdateObject
		Partially update an object. You must set the objectID attribute to indicate the object to update. 
		[ ] objectID is required
	[ ] partialUpdateObjectNoCreate
		- Same as partialUpdateObject, except that the object is not created if the object designated by objectID does not exist.
	[x] deleteObject
		- Delete an object. You must set the objectID attribute to indicate the object to delete. 
	[ ] delete
		- Delete the index.
	[ ] clear
		- Remove the index’s content, but keep settings and index-specific API keys untouched.

*/

export const batchRegex = /^\/1\/indexes\/(?<indexName>[^\/+]+)\/batch$/
import { defaultHeaders } from "../../constants";

type AlgoliaInputRequest = {
	action: string;
}

export const batch = async (storage:any, { indexName }: any, body: string ) => {
	//console.log("batch", indexName );
	let response;

	const payload: { requests: any } = JSON.parse(body);
	//console.log ("batch payload", payload.requests);

	if (!Array.isArray(payload.requests)) {
		return {
			statusCode: 500,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": "payload.requests not provided",
				"status": 400,
			})
		}
	}

	let objectIDs:any = []


	for (const request of payload.requests) {

		if ( request.action === "updateObject") {
			const Item = storage.replaceObject( indexName, request.body )
			objectIDs.push ( Item.objectID )
		}

		if ( request.action === "deleteObject") {
			const { objectID } = request.body;
			await storage.deleteObject( indexName, objectID );
			objectIDs.push ( objectID )
		}
	}

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			objectIDs,
			taskID: new Date().getTime(),
		})
	}
}