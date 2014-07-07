/*!
 * GridFS file server for Connect v0.0.3
 * https://github.com/baryshev/connect-gridfs
 *
 * Copyright 2013, Vadim M. Baryshev <vadimbaryshev@gmail.com>
 * Licensed under the MIT license
 * https://github.com/baryshev/connect-gridfs/LICENSE
 */
 var separator = /^[\s\/]+|[\s\/]+$/g;
 require('locus');
 module.exports = function (options) {
 	options = options || {};
 	if (typeof options.db === 'undefined') {
 		throw new Error('Required MongoDB database instance is missing');
 	}
 	if (!options.db.openCalled) {
 		throw new Error('MongoDB database instance should be opened');
 	}

 	var db = options.db;
 	var zlib = null;
 	var gzip = false;
 	var gzipOptions = null;
 	var gzipMimeTypes = null;
 	var gzipMinLength = null;

 	if (options.gzip) {
 		gzip = true;
 		zlib = require('zlib');
 		if (typeof options.gzip === 'object') {
 			gzipOptions = options.gzip;
 			if (gzipOptions.mimeTypes !== undefined) {
 				gzipMimeTypes = {};
 				for (var i = 0; i < gzipOptions.mimeTypes.length; i++) {
 					gzipMimeTypes[gzipOptions.mimeTypes[i]] = true;
 				}
 				delete(gzipOptions.mimeTypes);
 			}
 			if (gzipOptions.minLength !== undefined) {
 				gzipMinLength = gzipOptions.minLength;
 				delete(gzipOptions.minLength);
 			}
 		}
 	}

 	/* instaceof Binary hack */
 	var bson = require('mongodb/node_modules/bson');
 	bson.Binary = db.bsonLib.Binary;
 	/* /instaceof Binary hack */

 	var mongodb = require('mongodb');
 	var url = require('url');

 	return function gridfsMiddleware(req, res, next) {
 		if (req.method !== 'GET' && reqstream.pipe.method !== 'HEAD') {
 			return next();
 		}
		var query = url.parse(req.url, true).query;
  	if (query.id)
  		my_file = new mongodb.ObjectID(query.id);
  	else if(query.filename)
  		my_file = filename;
  	else
  		throw new Error('Missing required parameters (id/fiename)');
		// eval(locus);
		var gs = new mongodb.GridStore(db,my_file,'r');
		gs.open(function gridfsOnOpen(err, gs) {
			if (err) {
				return next();
			}
			res.setHeader('Content-Type', gs.contentType);
			res.setHeader('Last-Modified', gs.uploadDate.toUTCString());
			res.setHeader('Content-Disposition', 'attachment;filename=' + gs.filename);
			if (req.method === 'GET') {
				var stream = gs.stream(true);
				if (gzip && (!gzipMinLength || gzipMinLength <= gs.length) && (!gzipMimeTypes || gzipMimeTypes[gs.contentType])) {
					res.setHeader('Content-Encoding', 'gzip');
					stream.pipe(zlib.createGzip(gzipOptions)).pipe(res);
				} else {
					res.setHeader('Content-Length', gs.length);
					stream.pipe(res);
				}
			} else {
				res.setHeader('Content-Length', gs.length);
				gs.close();
				res.end();
			}
		});
	}
};
