// mock what Algolia is returning
export const defaultHeaders = {
	'Server': "nginx",
	'Date': new Date().toUTCString(),
	'Content-Type': "application/json; charset=UTF-8",
	'Connection': "keep-alive",
	'Accept-Encoding': "deflate, gzip",
	'Cache-Control': "no-store",
	'Access-Control-Allow-Origin': "*",
	'Timing-Allow-Origin': "*",
	'X-Content-Type-Options': "nosniff",
	'Strict-Transport-Security': "max-age=31536000; includesubDomains; preload",
	'Content-Disposition': "inline; filename=a.txt", // <- yep Algolia returns it like this
}

export const defaultHitsPerPage = 20;

export const defaultIndexSettings = {
	minWordSizefor1Typo: 4,
	minWordSizefor2Typos: 8,
	hitsPerPage: 20,
	maxValuesPerFacet: 100,
	version: 2,
	attributesToIndex: null,
	numericAttributesToIndex: null,
	attributesToRetrieve: null,
	unretrievableAttributes: null,
	optionalWords: null,
	attributesForFaceting: null,
	attributesToSnippet: null,
	attributesToHighlight: null,
	paginationLimitedTo: 1000,
	attributeForDistinct: null,
	exactOnSingleWordQuery: 'attribute',
	ranking: [
	  'typo',      'geo',
	  'words',     'filters',
	  'proximity', 'attribute',
	  'exact',     'custom'
	],
	customRanking: null,
	separatorsToIndex: '',
	removeWordsIfNoResults: 'none',
	queryType: 'prefixLast',
	highlightPreTag: '<em>',
	highlightPostTag: '</em>',
	alternativesAsExact: [ 'ignorePlurals', 'singleWordSynonym' ]
}