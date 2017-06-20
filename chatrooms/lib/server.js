var http = require('http'), // 内置的http模块提供了HTTP服务器和客户端功能
	fs = require('fs'), // 内置的fs模块提供了与文件系统相关的功能
	path = require('path'), // 内置的path模块提供了与文件系统路径相关的功能
	mime = require('mime'), // 附加的mine模块，有根据文件扩展名得出MIME类型的能力

	cache = {}, // cache是用来缓存文件内容的对象
	server = null; // 服务器

// Functions..................................................................................

	// 添加三个辅助函数以提供静态HTTP文件服务
	// 所请求的文件不存在时发送404错误
	function send404(response){
		response.writeHead(404, {
			'Content-Type': 'text/plain'
		});
		response.write('Error 404: resource not found.');
		response.end();
	}

	// 提供文件数据服务; 先写出正确的请求头，然后发送文件的内容
	function sendFile(response, filePath, fileContents){
		response.writeHead(200, {
			'Content-Type': mime.lookup(path.basename(filePath))
		});
		response.end(fileContents);
	}

	// 确定文件是否缓存了
	function serveStatic(response, cache, absPath){
		// 检查文件是否缓存在内存中
		if(cache[absPath]){
			// 从内存中返回文件
			sendFile(response, absPath, cache[absPath]);
		}else{
			// 检查文件是否存在
			fs.exists(absPath, function(exists){
				if(exists){
					// 从硬盘中读取文件
					fs.readFile(absPath, function(err, data){
						if(err){
							send404(response);
						}else{
							cache[absPath] = data;
							sendFile(response, absPath, data); // 从硬盘中读取文件并返回
						}
					});
				}else{
					// 文件不存在，发送HTTP 404响应
					send404(response);
				}
			});
		}
	}

// Initializaion........................................................................

	// 创建HTTP服务器，用匿名函数定义每个请求的处理行为
	server = http.createServer(function(request, response){
		var filePath = null,
			absPath = null;

		if(request.url == '/'){
			// 返回默认的HTML文件
			filePath = 'public/index.html';
		}else{
			// 将URL路径转为文件的相对路径
			filePath = 'public' + request.url;
		}

		// 设置绝对路径
		absPath = '../' + filePath;

		// 返回静态文件
		serveStatic(response, cache, absPath);
	});

	// 让服务器监听TCP/IP端口3000
	server.listen(8080, function(){
		console.log("Server listening on port 8080.");
	});