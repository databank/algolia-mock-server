
const url = require("url");
import { rawHandler } from "./index";

const getBody = ( r:any ) => {
	return new Promise((resolve) => {
		let body = '';
		r.on('data', (chunk:string) => {
			body += chunk;
		});
		r.on('end', () => {
			resolve(body)
		});
	})
}

export const httpHandler = ( storage:any ) => {
	return async ( req:any, res:any ) => {
		const { pathname, query } = url.parse(req.url, true );
		//console.log( req.method, pathname )
		const qs = {...query}
		let body;

		if (["POST","PUT"].includes( req.method )) {
			body = await getBody(req)
		}

		const response = await rawHandler({
			path: pathname,
			httpMethod: req.method,
			qs,
			body: body,
			headers: req.headers,
		}, storage );

		res.writeHead(response.statusCode, response.headers );
		res.end(response.body);
	}
}

