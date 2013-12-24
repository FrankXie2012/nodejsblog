var mongodb = require('./db');
console.info('in here');
exports.find = function(req, res) {
	var keyword = new RegExp('^.*' + req.params.search + '.*$', 'i');
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);//错误，返回 err 信息
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.find({
				'title': keyword
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, items) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				res.jsonp(items);
			});
		});
	});
};