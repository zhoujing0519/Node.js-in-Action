var http = require('http'),
	fs = require('fs'),

	server;

/*

	// 创建HTTP服务器并用回调定义响应逻辑
	http.createServer(function(req, res){
		if(req.url == '/'){
			// 读取Json文件并用回调定义如何处理其中的内容
			fs.readFile('./titles.json', function(err, data){
				if(err){
					// 如果出错，输出错误日志，并给客户端返回"Server Error."
					console.error(err);
					res.end('Server Error.');
				}else{
					// 从JSON文本解析数据
					var titles = JSON.parse(data.toString());

					// 读取HTML模板，并在加载完成后使用回调
					fs.readFile('./template.html', function(err, data){
						if(err){
							console.error(err);
							res.end('Server Error.');
						}else{
							var tmpl = data.toString(),

								// 组装HTML页面以显示博客标题
								html = tmpl.replace('%', titles.join('</li><li>'));

							res.writeHead(200, {
								'Content-Type': 'text/html'
							});

							// 将HTML页面发送给用户
							res.end(html);
						}
					});
				}
			});
		}
	}).listen(8000, '127.0.0.1');

*/

// Functions...............................................................................................

	// 获取标题，并将控制权转交给getTemplate
	function getTitles(res){
		fs.readFile('./titles.json', function(err, data){
			if(err) return hadError(err, res);
			getTemplate(JSON.parse(data.toString()), res);
		});
	}

	// getTemplate读取模板文件，并将控制权转交给formatHtml
	function getTemplate(titles, res){
		fs.readFile('./template.html', function(err, data){
			if(err) return hadError(err, res);
			formatHtml(titles, data.toString(), res);
		});
	}

	// formatHtml得到标题和模板，渲染一个响应给客户端
	function formatHtml(titles, tmpl, res){
		var html = tmpl.replace('%', titles.join('</li><li>'));

		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.end(html);
	}

	// 如果这个过程中出现错误，hadError会将错误输出到控制台，并返回给客户'Server Error'
	function hadError(err, res){
		console.error(err);
		res.end('Server Error.');
	}

// Initialization..........................................................................................

	// 客户端请求一开始会进到这里
	server = http.createServer(function(req, res){
		// 控制权转交给getTitles
		getTitles(res);
	}).listen(8000, '127.0.0.1');