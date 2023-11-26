
/*
	https://www.algolia.com/doc/rest-api/search/#get-a-tasks-status
	https://www.algolia.com/doc/api-reference/api-methods/wait-task/

*/

import { defaultHeaders } from "../constants";

export const waitRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/task\/(?<taskID>.*)$/
export const wait = async (storage:unknown, { indexName, taskID }: any ) => {

	//console.log("wait", indexName, taskID ); 

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			status: "published", // notPublished
			pendingTask: false,
		})
	}

}