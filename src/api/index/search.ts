
/*
	https://www.algolia.com/doc/rest-api/search/#search-index-post
	https://www.algolia.com/doc/api-reference/api-methods/search/

		[ ] allows for the retrieval of up to 1000 hits, unless paginationLimitedTo is increased

		[ ] index settings
			[x] attributesToRetrieve - index setting
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except
			[x] unretrievableAttributes
			[ ] unretrievableAttributes - retrieve when authenticated with the admin API key
			[ ] test unretrievable nested
			[ ] searchableAttributes
				[ ] multi attributes: 'title,alternative_title',
				[ ] no order: 'unordered(text)'
				[ ] nested: 'emails.personal'

		[ ] parameters:
			[x] query string

			// attributes
			[x] attributesToRetrieve - api parameter
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except

			[ ] restrictSearchableAttributes - overrides searchableAttributes for specific searches, without changing the priority order of the searchableAttributes.

			// ranking
			[ ] relevancyStrictness

			// filters
			[ ] filters
			[*] facetFilters - in progress
			[ ] optionalFilters
			[ ] numericFilters
			[ ] tagFilters
			[ ] sumOrFiltersScores

			// 
			[ ] facets
			[ ] maxValuesPerFacet
			[ ] facetingAfterDistinct
			[ ] sortFacetValuesBy

			// snippeting
			[ ] attributesToHighlight
			[ ] attributesToSnippet
			[ ] highlightPreTag
			[ ] highlightPostTag
			[ ] highlightPostTag
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

			// language
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
			[ ] getRankingInfo - https://www.algolia.com/doc/api-reference/api-parameters/getRankingInfo/
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

		[ ] response
			[ ] 


*/

import { 
	applyAttributesToRetrieve, 
	applyUnretrievableAttributes, 
	applyQueryTermToAllObjects,
	applyFacetFiltersToAllObjects,
	applyDistinctToAllObjects,
	extractFacetsFromObjects,
} from "../utils";

export const searchRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/query$/

export const searchGet = async (storage:unknown, { indexName }: any, event: any ) => {
	throw new Error("not implemented")
}

import { defaultHeaders, defaultHitsPerPage } from "../../constants";

export const searchPost = async (storage:any, { indexName }: any, event: any ) => {
	const { qs, headers, body } = event;
	const secret = headers["x-algolia-api-key"];

	let payload;
	try {
		payload = JSON.parse(body);
	} catch (e) {
		throw new Error("Unable to parse post body")
	}

	const {
		query,
		page: clientPage,
		hitsPerPage : clientHitsPerPage,
		attributesToRetrieve,
		facetFilters,
		facets: clientFacets,
		distinct: clientDistinct,
	} = payload;

	const indexSettings = await storage.getIndex( indexName );
	const { 
		attributesToRetrieve: indexAttributesToRetrieve, 
		unretrievableAttributes,
		attributesForFaceting,
		distinct,
		attributeForDistinct,
	} = indexSettings;

	let objects = await storage.getAllObjects( indexName );


	// filter by query text
	if (typeof query === "string" )
		objects = applyQueryTermToAllObjects( objects, query );


	// apply facetFilters
	if (Array.isArray(facetFilters) && facetFilters.length )
		objects = applyFacetFiltersToAllObjects( objects, facetFilters, attributesForFaceting || [] );

	// apply distinct
	if (distinct && attributeForDistinct && clientDistinct !== false) {
		objects = applyDistinctToAllObjects( objects, distinct, attributeForDistinct )
	}


	// count facets for remaining data
	let facets;
	if ((clientFacets || []).length)
		facets = extractFacetsFromObjects(objects, attributesForFaceting || [], clientFacets );


	// attributesToRetrieve
	if (attributesToRetrieve) {
		objects = objects.map( (o:any) => applyAttributesToRetrieve( o, attributesToRetrieve ))
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

	const page = clientPage || 0;
	const hitsPerPage = clientHitsPerPage || defaultHitsPerPage;
	const nbHits = objects.length;
	const nbPages = Math.ceil( nbHits / hitsPerPage )

	// skip results
	if (page > 0)
		objects = objects.slice(page*hitsPerPage)

	// apply hitsPerPage
	objects = objects.slice(0, hitsPerPage );

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
			hits: objects,
			nbHits,
			facets,
			page,
			nbPages,
			hitsPerPage,
			query,
			params: body,
		})
	}
}