module.exports = MongoPerstore;

var mongoRql = require('mongo-rql'),
	Q = require('q'),
	DuplicateEntryError = require('perstore/errors').DuplicateEntryError;

function MongoPerstore(options) {
	if (!this instanceof MongoPerstore) {
		return new MongoPerstore(options);
	}

	options = options || {};

	if (!options.db) {
		throw new Error('a db must be provided to MongoPerstore');
	}

	if (!options.collection) {
		throw new Error('a collection name must be provided to MongoPerstore');
	}

	this.db = options.db;
	this.collection = options.collection;
}

MongoPerstore.prototype = {
	constructor: MongoPerstore,

	idProperty: 'id',

	get: function (id) {
		var idProperty = this.idProperty;

		return this._getCollection().then(function (collection) {
			var query = {};

			query[ idProperty ] = id;

			return Q.ninvoke(collection, 'findOne', query, { fields: { _id: 0 } });
		});
	},

	put: function (value, options) {
		options = options || {};

		var store = this,
			idProperty = store.idProperty,
			key = options.id != null ?
				value[ idProperty ] = options.id :
				// TODO: assign an id
				value[ idProperty ];

		return store._getCollection().then(function (collection) {
			var result,
				query;

			if (options.overwrite === false) {
				result = store.get(key)
				.then(function (doc) {
					if (doc === null) {
						return Q.ninvoke(collection, 'insert', value);
					}
					else {
						throw new DuplicateEntryError(key + ' exists, and can\'t be overwritten');
					}
				});
			}
			else {
				query = {};
				query[ idProperty ] = key;
				// TODO: any options needed apart from upsert
				result = Q.ninvoke(collection, 'update', query, value, { upsert: options.overwrite });
			}

			return result.then(function () {
				delete value._id;
				return key;
			});
		});
	},

	delete: function (id) {
		var idProperty = this.idProperty;

		return this._getCollection().then(function (collection) {
			var query = {};

			query[ idProperty ] = id;

			return Q.ninvoke(collection, 'remove', query);
		});
	},

	query: function (query, options) {
		// convert rql query to mongodb query
		var mongoQuery = mongoRql(query, options),
			criteria = mongoQuery.criteria,
			fields = mongoQuery.projection || {},
			dbOptions = {
				skip: mongoQuery.skip,
				limit: mongoQuery.limit,
				fields: fields,
				sort: mongoQuery.sort
			};

		fields._id = 0;

		return this._getCollection().then(function (collection) {
			return Q.ninvoke(collection, 'find', criteria, dbOptions)
			.then(function (cursor) {
				return Q.all([
					Q.ninvoke(cursor, 'count'),
					Q.ninvoke(cursor, 'toArray')
				])
				.spread(function (totalCount, items) {
					items.totalCount = totalCount;
					return items;
				});
			});
		});
	},

	explain: function (query, options) {
		// convert rql query to mongodb query
		var mongoQuery = mongoRql(query, options),
			criteria = mongoQuery.criteria,
			fields = mongoQuery.projection || {},
			dbOptions = {
				skip: mongoQuery.skip,
				limit: mongoQuery.limit,
				fields: fields,
				sort: mongoQuery.sort
			};

		fields._id = 0;

		return this._getCollection().then(function (collection) {
			return Q.ninvoke(collection, 'find', criteria, dbOptions)
			.then(function (cursor) {
				return Q.ninvoke(cursor, 'explain');
			});
		});
	},

	_getCollection: function () {
		var collection = this.collection,
			idProperty = this.idProperty;

		return Q.when(this.db).then(function (db) {
			var index = {},
				coll = db.collection(collection);

			index[ idProperty ] = 1;

			return Q.ninvoke(coll, 'ensureIndex', index, {
				unique: true
			})
			.then(function () {
				return coll;
			});
		});
	}
};
