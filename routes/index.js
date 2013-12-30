var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');
    // Autocomplete = require('../models/autocomplete.js');

module.exports = function(app){
    app.get('/', function (req, res) {
      var page = req.query.p ? parseInt(req.query.p) : 1;
      Post.getTen(null, page, function(err, posts, total){
        if (err) {
          posts = [];
        }
        res.render('index', {
          title: 'Home',
          user: req.session.user,
          posts: posts,
          page: page,
          total: total,
          isFirstPage: (page-1)===0,
          isLastPage: ((page-1)*10+posts.length)==total,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
      res.render('reg', {
        title: 'Register',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
      var name = req.body.name,
          password = req.body.password;
      //生成密码的 md5 值
      var md5 = crypto.createHash('md5');
      var pwd = md5.update(req.body.password).digest('hex');
      var newUser = new User({
          name: req.body.name,
          password: pwd,
          email: req.body.email
      });
      //检查用户名是否已经存在
      User.get(newUser.name, function (err, user) {
        if (user) {
          req.flash('error', '用户已存在!');
          return res.redirect('/reg');//返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function (err, user) {
          if (err) {
            req.flash('error', err);
            return res.redirect('/reg');//注册失败返回主册页
          }
          req.session.user = user;//用户信息存入 session
          req.flash('success', '注册成功!');
          res.redirect('/');//注册成功后返回主页
        });
      });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
      res.render('login', {
        title: 'Login',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
      //生成密码的 md5 值
      var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');
      //检查用户是否存在
      User.get(req.body.name, function (err, user) {
        if (!user) {
          req.flash('error', '用户不存在!');
          return res.redirect('/login');//用户不存在则跳转到登录页
        }
        //检查密码是否一致
        if (user.password != password) {
          req.flash('error', '密码错误!');
          return res.redirect('/login');//密码错误则跳转到登录页
        }
        //用户名密码都匹配后，将用户信息存入 session
        req.session.user = user;
        req.flash('success', '登陆成功!');
        res.redirect('/');//登陆成功后跳转到主页
      });
    });

    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
      res.render('post', {
        title: 'Post',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
      if (req.files.image.originalFilename === '') {
        req.files.image = '';
      }
      if (req.body.post == '') {
        req.flash('error', '正文不能为空！');
        return res.redirect('/post');
      }
      var currentUser = req.session.user,
          tags = [req.body.tag1, req.body.tag2, req.body.tag3],
          post = new Post(currentUser.name, currentUser.head, req.body.title, req.body.post, tags, req.files.image);
      post.save(function(err){
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        req.flash('success', '发布成功！');
        res.redirect('/'); // 发布成功跳转到主页
      });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });

    app.get('/u/:name', function(req, res){
      var page = req.query.p ? parseInt(req.query.p) : 1;
      User.get(req.params.name, function(err, user){
        if (!user) {
          req.flash('error', '用户不存在！');
          return res.redirect('/');
        }

        Post.getTen(user.name, page, function(err, posts, total){
          if (err) {
            req.flash('error', err);
            return res.redirect('/');
          }

          res.render('index', {
            title: user.name,
            posts: posts,
            page: page,
            total: total,
            isFirstPage: (page-1)===0,
            isLastPage: ((page-1)*10+posts.length)==total,
            user : req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
        });
      });
    });

    app.get('/u/:name/:title', function (req, res){
      Post.getOne(req.params.name, req.params.title, function(err, post){
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }

        res.render('article', {
          title: req.params.title,
          user: req.session.user,
          post: post,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.post('/u/:name/:title', function (req, res) {
      var date = new Date(),
          time = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
      var md5 = crypto.createHash('md5'),
          email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
          head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
      var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
      };
      var newComment = new Comment(req.params.name, req.params.title, comment);
      newComment.save(function (err) {
        if (err) {
          req.flash('error', err);
          return res.redirect('back');
        }
        req.flash('success', '留言成功');
        res.redirect('back');
      });
    });

    app.get('/edit/:name/:title', checkLogin);
    app.get('/edit/:name/:title', function(req, res){
      var currentUser = req.session.user;
      Post.edit(currentUser.name, req.params.title, function(err, post){
        if (err) {
          req.flash('error', err);
          return res.redirect('back');
        }
        res.render('edit', {
          title: 'Edit',
          post: post,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.post('/edit/:name/:title', checkLogin);
    app.post('/edit/:name/:title', function (req, res) {
      var currentUser = req.session.user;
      if (req.files.image.originalFilename === '') {
        req.files.image = '';
      }
      Post.update(currentUser.name, req.params.title, req.body.post, req.body.tags, req.files.image, function (err) {
        var url = '/u/' + req.params.name + '/' + req.params.title;
        if (err) {
          req.flash('error', err);
          return res.redirect(url);//出错！返回文章页
        }
        req.flash('success', '修改成功!');
        res.redirect(url);//成功！返回文章页
      });
    });

    app.get('/delete/:name/:title', checkLogin);
    app.get('/delete/:name/:title', function (req, res) {
      var currentUser = req.session.user;
      Post.delete(currentUser.name, req.params.title, function (err) {
        if (err) {
          req.flash('error', err);
          return res.redirect('back');
        }
        req.flash('success', '删除成功!');
        res.redirect('/');
      });
    });

    app.get('/archive', function (req, res) {
      Post.getArchive(function (err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('archive', {
          title: 'Archive',
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.get('/tags', function (req, res) {
      Post.getTags(function (err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('tags', {
          title: 'Tags',
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.get('/tag/:tag', function (req, res) {
      Post.getTag(req.params.tag, function (err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('tag', {
          title: 'TAG:' + req.params.tag,
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.get('/search', function (req, res) {
      Post.search(req.query.keyword, function (err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('tag', {
          title: 'SEARCH:' + req.query.keyword,
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });

    app.get('/links', function (req, res) {
      res.render('links', {
        title: 'LINKS',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

    // app.get('/autocomplete/:keyword', function (req, res) {
    //   console.info(req.params.keyword);
    //   Autocomplete.find(req.params.keyword);
    // });

    app.get('/reprint/:name/:title', checkLogin);
    app.get('/reprint/:name/:title', function (req, res) {
      Post.edit(req.params.name, req.params.title, function (err, post) {
        if (err) {
          req.flash('error', err);
          return res.redirect(back);
        }
        var currentUser = req.session.user,
            reprint_from = {name: post.name, title: post.title},
            reprint_to = {name: currentUser.name, head: currentUser.head};
        Post.reprint(reprint_from, reprint_to, function (err, post) {
          if (err) {
            req.flash('err', err);
            return res.redirect('back');
          }
          req.flash('success', '转载成功！');
          var url = '/u/' + post.name + '/' + post.title;
          res.redirect(url);
        });
      });
    });

    app.use(function (req, res) {
      res.render("404");
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!');
            res.redirect('back');
        }
        next();
    }
};