var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, post, tags, image) {
  this.name = name;
  this.head = head;
  this.title = title;
  this.post = post;
  this.image = image;
  this.tags = tags;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  };
  //要存入数据库的文档
  var post = {
      name: this.name,
      head: this.head,
      time: time,
      title: this.title,
      post: this.post,
      image: this.image,
      tags: this.tags,
      comments: [],
      reprint_info: {},
      pv: 0
  };

  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

//读取文章及其相关信息
Post.getTen = function(name, page, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (page - 1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);//失败！返回 err
          }
          // 解析Markdown为html
          docs.forEach(function(doc){
            doc.post = markdown.toHTML(doc.post);
          });
          callback(null, docs, total);//成功！以数组形式返回查询的结果
        });
      });
    });
  });
};

Post.getOne = function(name, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "title": title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //解析 markdown 为 html
        if (doc) {
          collection.update({
            'name': name,
            'title': title
          }, {
            $inc: {'pv': 1}
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        }
        callback(null, doc);//返回查询的一篇文章
      });
    });
  });
};

Post.edit = function(name, title, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "title": title
      }, function(err, doc){
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);
      });
    });
  });
};

//更新一篇文章及其相关信息
Post.update = function(name, title, post, tags, image, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        "name": name,
        "title": title
      }, {
        $set: {post: post, image: image}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

//删除一篇文章
Post.delete = function(name, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({
        'name': name,
        'title': title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        var reprint_from = '';
        if (doc.reprint_info.reprint_from) {
          reprint_from = doc.reprint_info.reprint_from;
        }
        if (reprint_info != '') {
          collection.update({
            'name': reprint_from.name,
            'title': reprint_from.title
          }, {
            $pull: {
              'reprint_info.reprint_to': {
                'name': name,
                'title': title
              }
            }
          }, function (err) {
            if (err) {
              mongodb.close();
              return callback(err);
            }
          });
        }
        //根据用户名、日期和标题查找并删除一篇文章
        collection.remove({
          "name": name,
          "title": title
        }, {
          w: 1
        }, function (err) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null);
        });
      })
    });
  });
};

Post.getArchive = function (callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.find({}, {
        'name': 1,
        'time': 1,
        'title': 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

Post.getTags = function(callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.distinct('tags', function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

Post.getTag = function(tag, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.find({
        'tags': tag
      }, {
        'name': 1,
        'time': 1,
        'title': 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp("^.*" + keyword + ".*$", "i");
      collection.find({
        "title": pattern
      }, {
        "name": 1,
        "title": 1,
        "time": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
         return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

Post.reprint = function(reprint_from, reprint_to, callback) {
  mongodb.open(function (err, db){
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({
        'name': reprint_from.name,
        'title': reprint_from.title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }

        var date = new Date();
        var time = {
          date: date,
          year : date.getFullYear(),
          month : date.getFullYear() + "-" + (date.getMonth() + 1),
          day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
          minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
          date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        };

        delete doc._id;

        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : '[转载] ' + doc.title;
        doc.comments = [];
        doc.reprint_info = {'reprint_from': reprint_from};
        doc.pv = 0;

        collection.update({
          'name': reprint_from.name,
          'title': reprint_from.title
        }, {
          $push: {
            'reprint_info.reprint_to': {
              'name': doc.name,
              'title': doc.title
            }
          }
        }, function (err) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
        });

        collection.insert(doc, {
          safe: true
        }, function (err, post) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(err, post[0]);
        });
      });
    });
  });
};