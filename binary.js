var bson = require('bson'),
	fs = require('fs'),
	Q = require('q');

module.exports = binary;

function binary(store) {
	var put = store.put,
		get = store.get;

	if (put) {
		store.put = function (value) {
			value.contents = new bson.Binary(fs.readFileSync(value.path));
			return put.apply(this, arguments);
		};
	}

	if (get) {
		store.get = function () {
			return Q.when(get.apply(this, arguments))
			.then(convertObjectToStream);
		};
	}

	return store;
}

function convertObjectToStream(object) {
	var contents,
		disposition,
		metadata;

	if (object) {
		contents = object.contents;
		object.forEach = function (each) {
			each(contents.buffer);
		};

		object[ 'content-type' ] = object.type;

		disposition = 'attachment';
		if (object.name) {
			disposition += ';filename="' + object.filename + '"';
		}

		metadata = {
			'content-type': object.type,
			'content-length': contents.buffer.length,
			'content-disposition': disposition,
			filename: object.name,
			alternates: [ object ]
		};

		object.forEach.binary = true;

		object.getMetadata = function () {
			return metadata;
		};
	}

	return object;
}
