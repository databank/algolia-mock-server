
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
// import { DynamoDBDocumentClient, GetCommand, QueryCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export const mockStorageDynamoDB = () => {
	// const client = new DynamoDBClient({});
	// const docClient = DynamoDBDocumentClient.from(client);

	return {
		getIndex: async ( index: string ) => {
			// const getIndexCommand = new GetCommand({
			// 	TableName: "algolia mock_indexes",
			// 	Key: {
			// 		index: indexName,
			// 	},
			// })

			let indexObject: any;
			// try {
			// 	const response = await docClient.send(getIndexCommand);
			// 	indexObject = response.Item;
			// } catch (err: any) {
			// 	// index not found
			// 	console.log(err)
			// 	throw new Error("index not found")
			// }

			// const indexReplicas:any = {}
			// let actualIndexName = indexReplicas[indexName] || indexName;

			return indexObject;
		},
		getObject: async ( index:string, objectID:string ) => {
			// console.log(`dynamodb.getObject( ${index}, ${objectID} )`)
			// const command = new GetCommand ({
			// 	TableName: "algolia_mock_objects",
			// 	Key: {
			// 		index, 
			// 		objectID,
			// 	}
			// });

			// let response = await docClient.send(command);

			// if (!response?.Item)
			// 	return false;

			// return {...response?.Item, ...{index: undefined }}
		},
		getAllObjects: async ( index:string ) => {
			console.log(`dynamodb.getAllObjects( ${index} )`)

			// const q: QueryCommandInput = {
			// 	TableName: "algolia mock objects",
			// 	KeyConditionExpression: "#indexkey = :indexVal",
			// 	ExpressionAttributeNames: {
			// 		"#indexKey": "index"
			// 	},
			// 	ExpressionAttributevalues: {
			// 		"indexVal": actualIndexName,
			// 	},
			// 	Consistentread: true,
			// }
			// console.log("dynamodb query", q);

			// const command = new QueryCommand(q);
			// try {
			// 	response = await docClient.send (command) ;
			// 	console. log(response)
			// } catch (err: any) {
			// 	console. log(err)
			// 	return {
			// 		statusCode: 500,
			// 		headers: {
			// 			...defaultHeaders,
			// 		},
			// 		body: JSON.stringify ({
			// 			"message": err.message,
			// 			"status": 500,
			// 		})
			// 	}
			// }
			// if (!response?.Items)
			// 	response.Items = []
			// // response.Items = response.Items.map((r) => { return {...r,...{index: undefined}}});

			// return response.Items

		},
		deleteAllObjects: async ( index:string ) => {
			console.log(`dynamodb.deleteAllObjects( ${index} )`)

			// let response;
			// const command = new QueryCommand({
			// 	TableName: "algolia mock_objects",
			// 	KeyConditionExpression: '#index = :index',
			// 	ExpressionAttributeNames: {
			// 		'#index': 'index',
			// 	},
			// 	ExpressionAttributeValues: {
			// 		index,
			// 	},
			// });


			// response = await docClient.send(command);

			// if (response.Items?.length) {
			// 	for (const Item of response.Items) {
			// 		const dc = new DeleteCommand({
			// 			TableName: "algolia_mock_objects",
			// 			Key: {
			// 				index,
			// 				objectID: Item.objectID,
			// 			}
			// 		});
		
			// 		await docClient.send(dc);
			// 	}
			// }

		},

		replaceObject: async ( index: string, object: any ) => {
			console.log(`dynamodb.replaceObject( ${index}, ${object} )`)

			// // @todo: must create index if not exists

			// let { objectID } = object;

			// if (!objectID) {
			// 	objectID = "generated_" + Math.random()*1000000000000;
			// 	object.objectID = objectID;
			// }

			// const command = new PutCommand({
			// 	TableName: "algolia_mock objects",
			// 	Item: object,
			// });

			// try {
			// 	await docClient.send(command);
			// 	console.log ("dynamodb.replaceItem", object )
			// } catch (err: any) {
			// 	console.log("dynamodb.replaceItem", object, err)
			// }

			// return { objectID };
		}
	}
}