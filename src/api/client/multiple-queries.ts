
/*

	https://www.algolia.com/doc/api-reference/search-api-parameters/

		[ ] index settings
			[x] attributesToRetrieve - index setting
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except
			[ ] unretrievableAttributes
				[x] unretrievableAttributes
				[ ] unretrievableAttributes - retrieve when authenticated with the admin API key
				[ ] test unretrievable nested
			[ ] searchableAttributes
				[ ] multi attributes: 'title,alternative_title',
				[ ] no order: 'unordered(text)'
				[ ] nested: 'emails.personal'

		[ ] parameters:
			[x] indexName
			[ ] type
			[x] query
			[ ] params
				// attributes
				[x] attributesToRetrieve - api parameter
				[ ] attributesToRetrieve - nested eg: author.name
				[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except
				[ ] restrictSearchableAttributes

				// ranking
				[ ] relevancyStrictness

				// filtering
				[ ] filters
				[*] facetFilters - in progress
				[ ] optionalFilters
				[ ] numericFilters
				[ ] tagFilters
				[ ] sumOrFiltersScores

				// faceting
				[ ] facets
				[ ] maxValuesPerFacet
				[ ] facetingAfterDistinct
				[ ] sortFacetValuesBy

				// highlighting-snippeting
				[ ] attributesToHighlight
				[ ] highlightPreTag
				[ ] highlightPostTag
				[ ] snippetEllipsisText
				[ ] restrictHighlightAndSnippetArrays

				// pagination
				[x] page
				[x] hitsPerPage
				[ ] offset
				[ ] length

				// typos
				[ ] minWordSizefor1Typo
				[ ] minWordSizefor2Typos
				[ ] typoTolerance
				[ ] allowTyposOnNumericTokens
				[ ] disableTypoToleranceOnAttributes

				// geo-search
				[ ] aroundLatLng
				[ ] aroundLatLngViaIP
				[ ] aroundRadius
				[ ] aroundPrecision
				[ ] minimumAroundRadius
				[ ] insideBoundingBox
				[ ] insidePolygon

				// languages
				[ ] ignorePlurals
				[ ] removeStopWords
				[ ] queryLanguages
				[ ] naturalLanguages
				[ ] decompoundQuery

				// rules
				[ ] enableRules
				[ ] ruleContexts

				// personalization
				[ ] enablePersonalization
				[ ] personalizationImpact
				[ ] userToken

				// query-strategy
				[ ] queryType
				[ ] removeWordsIfNoResults
				[ ] advancedSyntax
				[ ] optionalWords
				[ ] disableExactOnAttributes
				[ ] exactOnSingleWordQuery
				[ ] alternativesAsExact
				[ ] advancedSyntaxFeatures

				// advanced
				[*] distinct
				[ ] getRankingInfo
				[ ] clickAnalytics
				[ ] analytics
				[ ] analyticsTags
				[ ] synonyms
				[ ] replaceSynonymsInHighlight
				[ ] minProximity
				[ ] responseFields
				[ ] maxFacetHits
				[ ] percentileComputation
				[ ] attributeCriteriaComputedByMinProximity
				[ ] enableABTest
				[ ] enableReRanking
*/

import { 
	applyAttributesToRetrieve, 
	applyUnretrievableAttributes, 
	applyQueryTermToAllObjects,
	applyFacetFiltersToAllObjects,
	applyDistinctToAllObjects,
	extractFacetsFromObjects
} from "../utils";
import { defaultHeaders, defaultHitsPerPage } from "../../constants";

const querystring = require("node:querystring");

export const multipleQueriesRegex = /^\/1\/indexes\/(?<indexName>[^\/+]+)\/queries$/

export const multipleQueries = async (storage:any, { indexName }: any, event: any ) => {
	const { qs, headers, body } = event;
	const secret = headers["x-algolia-api-key"];

	let response;
	let results = []

	let payload;
	try {
		payload = JSON.parse(body);
	} catch (e) {
		throw new Error("Unable to parse post body")
	}

	//console.log ("multipleQueries", JSON.stringify(payload, null, "\t") );
	const { requests } = payload;

	for (const request of requests) {
		const {
		indexName, 
		query,
		params,
			// facetFilters
		} = request;

		const indexSettings = await storage.getIndex( indexName );
		const { 
			attributesToRetrieve: indexAttributesToRetrieve, 
			unretrievableAttributes, 
			attributesForFaceting,
			distinct,
			attributeForDistinct,
		} = indexSettings;

		let qp:any = {}
		try {
			qp = { ...querystring.parse(params)}
		} catch (e) {
			console.log(e);
			throw new Error("failed parsing params " );
		}
		//console.log("query params", qp);

		const { 
			attributesToRetrieve, 
			page: clientPage,
			hitsPerPage: clientHitsPerPage,
			facetFilters: clientFacetFilters,
			facets: clientFacets,
			distinct: clientDistinct,
		} = qp;
		let facetFilters;
		if (typeof clientFacetFilters === "string") {
			try {
				facetFilters = JSON.parse(clientFacetFilters);
			} catch(err) {
				throw new Error("Unable to parse facetFilters")
			}
		}


		let objects = await storage.getAllObjects( indexName );

		// filter by query text
		if (typeof query === "string" )
			objects = applyQueryTermToAllObjects( objects, query );

		// apply facetFilters
		if (Array.isArray(facetFilters) && facetFilters.length )
			objects = applyFacetFiltersToAllObjects( objects, facetFilters, attributesForFaceting || [] );

		// apply distinct
		if (distinct && attributeForDistinct && clientDistinct !== 'false') { // yep distinct comes from client as "string"
			objects = applyDistinctToAllObjects( objects, distinct, attributeForDistinct )
		}

		// attributesToRetrieve
		if (attributesToRetrieve && typeof attributesToRetrieve !== "string" )
			throw new Error("unexpected avalue for attributesToRetrieve");

		let clientAttributesToRetrieve: any;
		if (attributesToRetrieve) {
			clientAttributesToRetrieve = JSON.parse(attributesToRetrieve);
		}

		let facets;
		if ((clientFacets || []).length)
			facets = extractFacetsFromObjects(objects, attributesForFaceting || [], clientFacets );



		// attributesToRetrieve
		if (clientAttributesToRetrieve) {
			objects = objects.map( (o:any) => applyAttributesToRetrieve( o, clientAttributesToRetrieve ))
		} else {
			if (indexAttributesToRetrieve) {
				objects = objects.map( (o:any) => applyAttributesToRetrieve( o, indexAttributesToRetrieve ))
			}
		}

		// apply unretrievable attributes
		if (secret !== "ADMINKEY") {
			if (Array.isArray(unretrievableAttributes) && unretrievableAttributes.length ) {
				objects = objects.map((o:any) => applyUnretrievableAttributes( o, unretrievableAttributes))
			}
		}


		let page = 0;
		if (typeof clientPage === "string" && parseInt(clientPage) > 0)
			page = parseInt(clientPage);

		let hitsPerPage = defaultHitsPerPage;
		if (typeof clientHitsPerPage === "string" && parseInt(clientHitsPerPage) > 0 )
			hitsPerPage = parseInt(clientHitsPerPage);


		const nbHits = objects.length;
		const nbPages = Math.ceil (objects.length / hitsPerPage );

		// skip results
		if (page > 0)
			objects = objects.slice(page*hitsPerPage)

		// apply hitsPerPage
		objects = objects.slice(0, hitsPerPage );



		results.push({
			hits: objects,
			nbHits,
			facets,
			page,
			nbPages,
			hitsPerPage,
		// 	exhaustiveNbHits: true,
		// 	exhaustiveTypo: true,
		// 	exhaustive: {
		// 		nbhits: true, 
		// 		typo: true,
		// 	},
			query,
			params, 
			index: indexName, 
		// 	renderingContent: {}, 
		// 	processingTimeS: 0, 
		// 	processingTimingsMS: {},
		// 	serverTimeMS: 0,
		})
	}

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({results})
	}
}