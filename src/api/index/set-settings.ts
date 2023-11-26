
/*
	https://www.algolia.com/doc/rest-api/search/#set-settings
	https://www.algolia.com/doc/api-reference/api-methods/set-settings/
	https://www.algolia.com/doc/api-reference/settings-api-parameters/

		[ ] forwardToReplicas - when forwarding settings, please make sure your replicas already exist. It’s impossible to forward settings and create your replicas at the same time.
		[ ] settings

			// attributes
			[x] searchableAttributes
				[x] multi attributes: 'title,alternative_title',
				[x] no order: 'unordered(text)'
				[x] nested: 'emails.personal'

			[x] attributesForFaceting
			[x] unretrievableAttributes
			[x] attributesToRetrieve
			[ ] attributesToRetrieve - nested eg: author.name
			[ ] attributesToRetrieve: ['*', '-attribute1', '-attribute2' ] // retrieve all except

			// ranking
			[ ] mode
			[ ] ranking
			[ ] customRanking
			[ ] relevancyStrictness
			[ ] replicas

			// faceting
			[ ] maxValuesPerFacet
			[ ] sortFacetValuesBy

			// highlighting-snippeting
			[ ] attributesToHighlight
			[ ] attributesToSnippet
			[ ] highlightPreTag
			[ ] highlightPostTag
			[ ] snippetEllipsisText
			[ ] restrictHighlightAndSnippetArrays

			// pagination
			[x] hitsPerPage
			[ ] paginationLimitedTo

			// typos
			[ ] minWordSizefor1Typo
			[ ] minWordSizefor2Typos
			[ ] typoTolerance
			[ ] allowTyposOnNumericTokens
			[ ] disableTypoToleranceOnAttributes
			[ ] disableTypoToleranceOnWords
			[ ] separatorsToIndex

			// languages
			[ ] ignorePlurals
			[ ] attributesToTransliterate
			[ ] removeStopWords
			[ ] camelCaseAttributes
			[ ] decompoundedAttributes
			[ ] keepDiacriticsOnCharacters
			[ ] customNormalization
			[ ] queryLanguages
			[ ] indexLanguages
			[ ] decompoundQuery

			// rules
			[ ] enableRules

			// personalization
			[ ] enablePersonalization

			// query-strategy
			[ ] queryType
			[ ] removeWordsIfNoResults
			[ ] advancedSyntax
			[ ] optionalWords
			[ ] disablePrefixOnAttributess
			[ ] disableExactOnAttributes
			[ ] exactOnSingleWordQuery
			[ ] alternativesAsExact
			[ ] advancedSyntaxFeatures

			// performance
			[ ] numericAttributesForFiltering
			[ ] allowCompressionOfIntegerArray

			// advanced
			[ ] attributeForDistinct
			[ ] distinct
			[ ] replaceSynonymsInHighlight
			[ ] minProximity
			[ ] responseFields
			[ ] maxFacetHits
			[ ] attributeCriteriaComputedByMinProximity
			[ ] userData
			[ ] renderingContent
		[ ] should fail if not admin key

*/

import { defaultHeaders, defaultIndexSettings } from "../../constants";

export const setSettingsRegex = /^\/1\/indexes\/(?<indexName>[^\/]+)\/settings$/
export const setSettings = async (storage:any, { indexName }: any, event:any ) => {
	const { qs, body } = event;
	//console.log("setSettings", indexName, body ); 

	let payload;
	try {
		payload = JSON.parse(body);
	} catch (e) {
		throw new Error("Unable to parse post body")
	}

	const {
		attributesToRetrieve, // must be array
		unretrievableAttributes,
		searchableAttributes,
		attributesForFaceting,
		hitsPerPage,
	} = payload;


	const settings:any = {
		hitsPerPage,
		attributesToRetrieve,
		unretrievableAttributes,
	}

	if (Array.isArray(searchableAttributes)) {
		if (searchableAttributes.length) {
			settings.searchableAttributes = searchableAttributes.map((sa) => {
				return sa.split(",").map((sA:string) => sA.trim()).join(",")
			})
		} else {
			settings.searchableAttributes = null;
		}
	}

	if (Array.isArray(attributesForFaceting)) {
		if (attributesForFaceting.length) {
			settings.attributesForFaceting = attributesForFaceting;
		} else {
			settings.attributesForFaceting = null;
		}
	}
	

	await storage.setIndexSettings( indexName, settings );

	return {
		statusCode: 200,
		headers: {
			...defaultHeaders,
		},
		body: JSON.stringify({
				"updatedAt": new Date().toISOString(),
				"taskID": new Date().getTime(),
		})
	}
}