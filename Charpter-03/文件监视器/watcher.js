function Watcher(watchDir, processedDir){
	this.watchDir = watchDir; // 监控的目录
	this.processedDir = processedDir; // 放置修改过的文件目录
}

// 添加继承事件发射器行为的代码
var events = require('events'),
	util = require('util');

util.inherits(Watcher, events.EventEmitter); // ==> Watcher.prototype = new events.EventEmiiter();

// 扩展事件发射器的功能
var fs = require('fs'),
	watchDir = './watch',
	processedDir = './done';

// 扩展EventEmitter，添加处理文件的方法
Watcher.prototype.watch = function(){
	var watcher = this;

	fs.readdir(this.watchDir, function(err, files){
		if(err) throw err;

		// 处理watch目录中的所有文件
		for(var index in files){
			watcher.emit('process', files[index]);
		}
	});
};

// 扩展EventEmitter，添加开始监控的方法
Watcher.prototype.start = function(){
	var watcher = this;

	fs.watchFile(this.watchDir, function(){
		watcher.watch();
	});
};

// Initialization..........................................................................................

	var watcher = new Watcher(watchDir, processedDir);

	watcher.on('process', function process(file){
		var watchFile = this.watchDir + '/' + file,
			processedFile = this.processedDir + '/' + file.toLowerCase();

		fs.rename(watchFile, processedFile, function(err){
			if(err) throw err;
		});
	});

	watcher.start();