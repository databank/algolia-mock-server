

export const extractFieldFromObject = ( object:any, attributeName:string ) => {
	const path = attributeName.split(".");

	if (path.length > 1) {
		throw new Error("nested attributesToRetrieve not supported")
	}

	if (object.hasOwnProperty( attributeName )) {
		let response:any = {}

		response[attributeName] = object[attributeName];
		return response;
	}

	return {}
}

export const applyAttributesToRetrieve = ( object: any, attributesToRetrieve: string[] ) => {
	const attributesToRetrieveArr = [
		...attributesToRetrieve,
		...["objectID"],
	];

	let newResponse = {}
	for (const attributeName of attributesToRetrieveArr) {
		newResponse = {
			...newResponse,
			...extractFieldFromObject( object, attributeName ),
		}
	}
	return newResponse;
}

export const applyUnretrievableAttributes = ( object: any, unretrievableAttributes: string[] ) => {
	let newResponse:any = {}

	Object.keys( object ).map((k) => {
		if (!unretrievableAttributes.includes(k))
			newResponse[k] = object[k];
	})

	return newResponse;
}


/* search
	[x] case insensitive
	[ ] search type
		[x] phrase search
		[x] each word search
	[x] object traversal
		[x] walk object
		[x] walk array
	[ ] searchableAttributes
		[x] top level attributes
		[ ] same ranking attributes: "att1, att2"
		[ ] nested object: author.name
		[ ] nested array: authors.*.name
	[ ] ranking
		[ ] return ranking ?

	@todo: check partial match behavior in Algolia: "on" in "Bond"
*/

const findWordsInField = ( query:string, attributeValue: string ) => {
	let founds = 0;
	const queryList = (query || '').trim().toLowerCase()
		.split(" ")
		.map( (w:string) => w.trim() )
		.filter( (w:string) => w.length );

	queryList.map(( queryWord ) => {
		if (attributeValue.toLowerCase().includes( queryWord ))
			founds++;
	})

	if (founds >= queryList.length )
		return true;

	return false;
}

const recursiveSearchTerms = ( value:any, query: string, path: string ): boolean => {

	if ( value === null )
		return false;

	if ( typeof value === "boolean")
		return false;

	if ( typeof value === "number")
		return false;

	if ( typeof value === "string") {
		//console.log(`Q: ${path}`)
		return findWordsInField(query, value )
	}

	let keep = false;


	if (Array.isArray(value)) {
		value.map((v:any, idx: number ) => {
			if (recursiveSearchTerms( v, query, path + "[" + idx.toString() + "]" ))
				keep = true;
		})
	}


	if (typeof value === "object") {
		Object.keys(value).map((k:string) => {
			if (recursiveSearchTerms( value[k], query, path + "." + k ))
				keep = true;
		})
	}

	return keep;
}

export const applyQueryTermToAllObjects = ( objects: any[], query: string ) => {

		const queryList = (query || '').trim()
			.split(" ")
			.map( (w:string) => w.trim() )
			.filter( (w:string) => w.length )

		if (queryList.length) {
			objects = objects.filter((Item:any) => recursiveSearchTerms(Item, query, "" ))
		}
		return objects;
}


const knownFacetFiltersFunc = [ "filterOnly", "afterDistinct", "searchable" ]
const extractAttributesForFaceting = (attributesForFacetingRaw: string[] ) => {
	const ret: any = {}
	attributesForFacetingRaw
		//.map( a => a.trim() ) // do not trim, Algolia does not trim
		.map((attString) => {
			if (!attString.includes('(') && !attString.includes(')') ) {
				const attName = attString
				ret[attName] = {}
				return;
			}

			const re1 = /^(?<funcName>[^\(]+)\((?<attName>[^\)]+)\)\s?$/
			const { funcName, attName }:any = (attString.match(re1) || {})?.groups || {};
			if ( funcName && attName ) {
				if (!attName.trim())
					throw new Error(`cant understand ${attString}`);

				if (!funcName.trim())
					throw new Error(`cant understand ${attString}`);

				if (!knownFacetFiltersFunc.includes(funcName.trim()))
					throw new Error(`cant understand "${funcName}" in ${attString}` );

				ret[attName.trim()] = {}
				ret[attName.trim()][funcName.trim()] = true;
				return;
			}

			const re2 = /^(?<funcName1>[^\(]+)\((?<funcName2>[^\(]+)\((?<attN>[^\)]+)\)\s?\)\s?$/
			const { funcName1, funcName2, attN }:any = (attString.match(re2) || {})?.groups || {};
			if ( funcName1 && funcName2 && attN ) {
				if (!attN.trim())
					throw new Error(`cant understand ${attString}`);

				if (!funcName1.trim())
					throw new Error(`cant understand ${attString}`);

				if (!funcName2.trim())
					throw new Error(`cant understand ${attString}`);

				if (!knownFacetFiltersFunc.includes(funcName1.trim()))
					throw new Error(`cant understand "${funcName1}" in ${attString}` );

				if (!knownFacetFiltersFunc.includes(funcName2.trim()))
					throw new Error(`cant understand "${funcName2}" in ${attString}` );

				ret[attN.trim()] = {}
				ret[attN.trim()][funcName1.trim()] = true;
				ret[attN.trim()][funcName2.trim()] = true;
				return;
			}
			
		})

	return ret;
}
const lookupExactAttributeValueDeep = ( o: any, k: string, value: string ) => {
	let foundExact = false;

	if ( o === null ) {
		// doesnt seem to match with value:null
		return false;
	}

	if ( typeof o === "boolean") {
		if (o && value.toLowerCase().trim() === "true")
			return true;

		if (!o && value.toLowerCase().trim() === "false")
			return true;

		return false;
	}

	if ( typeof o === "number") {
		if (o.toString() === value.trim())
			return true;

		return false;
	}

	if ( typeof o === "string") {
		if (o.toLowerCase().trim() === value.toLowerCase().trim())
			return true;

		return false;
	}

	if (Array.isArray(o)) {
		// if 1 match, we're good
		let arrayMatches=0;
		o.map((oo) => {
			if (lookupExactAttributeValueDeep(oo, k , value )) {
				arrayMatches++;
				return;
			}
		})

		if (arrayMatches)
			return true;

		return false;
	}

	if (typeof o === "object") {
		Object.keys(o).map((ok:string) => {
			if (ok === k.trim() && lookupExactAttributeValueDeep(o[ok], k, value ) ) {
				foundExact = true;
				return;
			}

			if (k.split(".").length ) {
				const [ k_left ] = k.split(".");
				const   k_right = k.split(".").slice(1).join(".")

				if (ok === k_left) {
					if (lookupExactAttributeValueDeep(o[k_left], k_right , value )) {
						foundExact = true;
						return;
					}
				}


			}


			//	if (lookupExactAttributeValueDeep())
		// 	if (recursiveSearchTerms( value[k], query, path + "." + k ))
		// 		keep = true;
		})
		//throw new Error("nested for object not working yet")
	}

	return foundExact;
}

// https://www.algolia.com/doc/api-reference/api-parameters/facetFilters/
// [[ "attr1:v11", "attr1:v12"], ["attr2:v21"]] => (attr1 = V11 or attr1 = V12) and attr2 = V21

export const applyFacetFiltersToAllObjects = ( objects: any[], facetFilters: any[], attributesForFacetingRaw: string[] ) => {

	const attributesForFaceting = extractAttributesForFaceting(attributesForFacetingRaw)

	return objects.filter((o:any) => {
		// must and all facetFilters together at level1
		// must or all facetFilters at level 2
		let keep = true;

		facetFilters.map((ff: Array<any> | string ) => {
			if (typeof ff === "string") {
				let [ k,v ] = ff.split(":")
				// key not trimmed, Algolia will take it as is: " attribute "
				v = v.trim()

				if (!attributesForFaceting[k]) {
					keep = false;
					return;
				}

				if (!lookupExactAttributeValueDeep(o, k, v)) {
					keep = false;
					return
				}
			}

			if (Array.isArray(ff)) {
				if (!ff.length)
					return;

				let matches = 0;
				ff.map((fff) => {
					let [ k,v ] = fff.split(":")
					// key not trimmed, Algolia will take it as is: " attribute "
					v = v.trim()

					if (!attributesForFaceting[k]) {
						return;
					}

					if (lookupExactAttributeValueDeep(o, k, v)) {
						matches++;
						return
					}
				})

			// must match at least 1
			if (matches === 0)
				keep = false;

			}
		})

		return keep;
	})
}