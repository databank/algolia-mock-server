
/*
	https://www.algolia.com/doc/api-reference/api-methods/delete-index/
	https://www.algolia.com/doc/rest-api/search/#delete-index
*/
import { defaultHeaders } from "../../constants";

export const indexDeleteRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)$/

export const indexDelete = async (storage:any, { indexName }: any, event:any ) => {
	//console.log("index.delete()", indexName );

	await storage.deleteIndex( indexName );

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			taskId: new Date().getTime(),
			deletedAt: new Date().toISOString(),
		})
	}

}