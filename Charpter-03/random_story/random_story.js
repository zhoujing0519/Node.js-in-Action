var fs = require('fs'),
	request = require('request'),
	htmlparser = require('htmlparser'),

	configFilename = './rss_feeds.txt';

// Functions...................................................................

	// 任务1：确保包含RSS预定源URL列表的文件存在
	function checkForRSSFile(){
		fs.exists(configFilename, function(exists){
			if(!exists) return next(new Error('Missing RSS file: ' + configFilename));
			next(null, configFilename);
		});
	}

	// 任务2：读取并解析包含预定源URL的文件
	function readRSSFile(configFilename){
		fs.readFile(configFilename, function(err, feedList){
			if(err) return next(err);
			// 将预定源URL列表转换成字符串，然后分隔成一个数组
			feedList = feedList.toString().replace(/^\s+|\s+$/g, '').split('\n');

			var random = Math.floor(Math.random() * feedList.length);

			next(null, feedList[random]);
		});
	}

	// 任务3：向选定的预定源发送HTTP请求以获取数据
	function downloadRSSFeed(feedUrl){
		request({uri: feedUrl}, function(err, res, body){
			if(err) return next(err);
			if(res.statusCode != 200) return next(new Error('Abnormal response status code.'));

			next(null, body);
		});
	}

	// 任务4：将预定源数据解析到一个条目数组中
	function parseRSSFeed(rss){
		var handler = new htmlparser.RssHandler(),
			parser = new htmlparser.Parser(handler);

		parser.parseComplete(rss);

		if(!handler.dom.items.length) return next(new Error('No RSS items found.'));

		// 如果有数据，显示第一个预定源条目的标题和URL
		var item = handler.dom.items.shift();

		console.log(item.title);
		console.log(item.link);
	}

	// 把所有要做的任务按执行顺序添加到一个数组中
	var tasks = [checkForRSSFile, readRSSFile, downloadRSSFeed, parseRSSFeed];

	// 如果任务出错，则抛出异常
	function next(err, result){
		if(err) throw err;

		// 从任务数组中取出下一个任务
		var currentTask = tasks.shift();

		// 执行当前任务
		if(currentTask){
			currentTask(result);
		}
	}

	// 开始任务的串行化执行
	next();