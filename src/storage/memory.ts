

export const mockStorageMemory = () => {

	const storage:any = {

	}

	return {
		getIndex: async ( index: string ) => {
			//console.log(`memory.getIndex( ${index} )`)

			if (!storage[index])
				throw new Error("unknown index");

			return storage[index]._settings;
		},
		setIndexSettings: async ( index: string, settings:any ) => {
			//console.log(`memory.setIndexSettings( ${index}, ${JSON.stringify(settings)} )`)

			// if (!storage[index])
			// 	throw new Error("unknown index");

			if (!storage[index])
				storage[index] = {
					_settings: {},
					_items: {},
				}

			storage[index]._settings = {
				...storage[index]._settings,
				...settings,
			}
		},
		getObject: async ( index:string, objectID:string ) => {
			//console.log(`memory.getObject( ${index}, ${objectID} )`)

			if (!storage[index])
				throw new Error("unknown index");

			if (!storage[index]._items)
				return false;

			if (!storage[index]._items[objectID])
				return false;

			return storage[index]._items[objectID];
		},
		getAllObjects: async ( index:string ) => {
			//console.log(`memory.getAllObjects( ${index} )`)

			if (!storage[index])
				throw new Error("unknown index");

			if (!storage[index]._items)
				return [];

			return Object.values(storage[index]._items);
		},

		deleteObject: async ( index:string, objectID:string ) => {
			//console.log(`memory.deleteObject( ${index}, ${objectID} )`)

			if (!storage[index])
				throw new Error("unknown index");

			if (!storage[index]._items)
				return false;

			if (!storage[index]._items[objectID])
				return false;

			const deleted = storage[index]._items[objectID]
			
			delete storage[index]._items[objectID];

			return deleted;
		},
		deleteAllObjects: async ( index:string ) => {
			//console.log(`memory.deleteAllObjects( ${index} )`)

			if (!storage[index])
				throw new Error("unknown index");

			if (!storage[index]._items)
				return [];

			storage[index]._items = {};

			return [];
		},
		replaceObject: async ( index: string, object: any ) => {
			//console.log(`memory.replaceObject( ${index}, ${JSON.stringify(object)} )`)

			if (!storage[index])
				storage[index] = {
					_settings: {},
					_items: {},
				}

			if (!storage[index]._items)
				storage[index]._items = {}

			let { objectID } = object;

			if (!objectID) {
				objectID = "generated_" + Math.random()*1000000000000;
				object.objectID = objectID;
			}

			storage[index]._items[objectID] = object;

			return { objectID };
		},
		deleteIndex: async ( index:string ) => {
			//console.log(`memory.deleteIndex( ${index} )`)

			if (!storage[index])
				throw new Error("unknown index");

			delete storage[index];

			return true;
		},
	}
}