
/*
	https://www.algolia.com/doc/rest-api/search/#get-settings
	https://www.algolia.com/doc/api-reference/api-methods/get-settings/

*/


import { defaultHeaders, defaultIndexSettings } from "../../constants";

export const getSettingsRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/settings$/
export const getSettings = async (storage:any, { indexName }: any, event:any ) => {

	try {
		const indexSettings = await storage.getIndex( indexName );
		return {
			statusCode: 200,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				...defaultIndexSettings,
				...indexSettings,
			})
		}
	} catch (err) {
		return {
			statusCode: 404,
			headers: {
				...defaultHeaders,
			},
			body: JSON.stringify({
				"message": "Index not found",
				"status":  500,
			})
		}
	}


}