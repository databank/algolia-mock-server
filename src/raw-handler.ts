

import { getObject, getObjectRegex } from "./api/index/get-object"; 
import { deleteObject, deleteObjectRegex } from "./api/index/delete-object"; 
import { batch, batchRegex } from "./api/index/batch";
import { searchPost, searchGet, searchRegex } from "./api/index/search";
import { clearObjects, clearObjectsRegex } from "./api/index/clear-objects";


import { wait, waitRegex } from "./api/wait";

import { getSettingsRegex, getSettings } from "./api/index/get-settings";
import { setSettingsRegex, setSettings } from "./api/index/set-settings";
import { indexDeleteRegex, indexDelete } from "./api/index/delete";

import { searchForFacetValues, searchForFacetValuesRegex } from "./api/index/search-for-facet-values"; 
import { multipleQueries, multipleQueriesRegex } from "./api/client/multiple-queries"; 


export const rawHandler = async function ( event:any, storage:unknown) {
    const { path, httpMethod, body } = event;

    if (httpMethod === "GET" && path.match(waitRegex)) {
        const waitResponse = await wait(storage, path.match(waitRegex).groups )
        //console.log("wait() => ", waitResponse)
        return waitResponse;
    }

    if (httpMethod === "DELETE" && path.match(indexDeleteRegex)) {
        const indexDeleteResponse = await wait(storage, path.match(indexDeleteRegex).groups )
        //console.log("index.delete() => ", indexDeleteResponse)
        return indexDeleteResponse;
    }

    if (httpMethod === "GET" && path.match(getSettingsRegex)) {
        const getSettingsResponse = await getSettings(storage, path.match(getSettingsRegex).groups, event )
        //console.log("getSettings() => ", getSettingsResponse)
        return getSettingsResponse;
    }
    if (httpMethod === "PUT" && path.match(setSettingsRegex)) {
        const setSettingsResponse = await setSettings(storage, path.match(setSettingsRegex).groups, event )
        //console.log("setSettings() => ", setSettingsResponse)
        return setSettingsResponse;
    }

    if (httpMethod === "GET" && path.match(getObjectRegex)) {
        const getObjectResponse = await getObject(storage, path.match(getObjectRegex).groups, event )
        //console.log("getObject () => ", getObjectResponse)
        return getObjectResponse;
    }

    if (httpMethod === "DELETE" && path.match(deleteObjectRegex)) {
        const deleteObjectResponse = await deleteObject(storage, path.match(deleteObjectRegex).groups, event )
        //console.log("deleteObject () => ", deleteObjectResponse)
        return deleteObjectResponse;
    }

    // if (httpMethod === "POST" && path.match(queryRegex)) {
    //     const queryResponse = await query(path.match(queryRegex).groups, body )
    //     console.log("query() => ", queryResponse)
    //     return queryResponse;
    // }

    if (httpMethod === "POST" && path.match(multipleQueriesRegex)) {
        const queryResponse = await multipleQueries( storage, path.match(multipleQueriesRegex).groups, event )
        //console.log("multipleQueries() => ", queryResponse)
        return queryResponse;
    }
    
    if (httpMethod === "POST" && path.match(searchForFacetValuesRegex)) {
        const queryResponse = await searchForFacetValues(storage, path.match(searchForFacetValuesRegex).groups, event )
        // console.log("searchForFacetvalues() => ", queryResponse)
        return queryResponse;
    }

    if (httpMethod === "POST" && path.match(batchRegex)) {
        const batchResponse = await batch(storage, path.match(batchRegex).groups, body )
        //console.log("batch() => ", batchResponse)
        return batchResponse;
    }
    
    if (httpMethod === "POST" && path.match(clearObjectsRegex)) {
        const clearObjectsResponse = await clearObjects(storage, path.match(clearObjectsRegex).groups )
        //console.log("clearObjects() => ", clearObjectsResponse)
    	return clearObjectsResponse;
    }

    if (httpMethod === "GET" && path.match(searchRegex)) {
        const searchResponse = await searchGet(storage, path.match(searchRegex).groups, event )
        //console.log("searchGet() => ", searchResponse)
        return searchResponse;
    }
    if (httpMethod === "POST" && path.match(searchRegex)) {
        const searchResponse = await searchPost(storage, path.match(searchRegex).groups, event )
        //console.log("searchPost() => ", searchResponse)
        return searchResponse;
    }

    return {
        statusCode: 500,
        headers: {
            'Content-Type': "application/json",
        },
        body: JSON.stringify({ message: `unhandled endpoint ${path}`})
    }
}

