# mongo-perstore

A [perstore](https://github.com/persvr/perstore) interface that persists data using
[MongoDB](https://github.com/mongodb/node-mongodb-native)

[![Build
Status](https://travis-ci.org/neonstalwart/mongo-perstore.svg?branch=master)](https://travis-ci.org/neonstalwart/mongo-perstore)

# Example

```js
var MongoStore = require('mongo-perstore'),
	MongoClient = require('mongodb').MongoClient,
	url = 'mongodb://localhost:27017/mydb',
	Q = require('q'),
	db = Q.ninvoke(MongoClient, 'connect', url),
	store = new MongoStore({
		db: db,
		collection: 'myCollection'
	}),
	Query = require('rql/query').Query,
	query = new Query().eq('color', 'yellow').sort('-size', 'price');

// make a query using RQL
store.query(query).then(function (docs) {
	// ...
});
```

# Install

With [npm](https://npmjs.org/package/npm) do:

```sh
npm install mongo-perstore
```

# License

[New BSD License](LICENSE). All code is developed under the terms of the [Dojo Foundation CLA](http://dojofoundation.org/about/cla).

© 2014 Ben Hockey
