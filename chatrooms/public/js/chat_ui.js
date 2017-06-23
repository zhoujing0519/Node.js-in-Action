// Functions.....................................................................................

	// 显示可疑文本
	function divEscapedContentElement(message){
		return $('<div></div>').text('message');
	}

	// 显示系统创建的授信内容
	function divSystemContentElement(message){
		return $('<div></div>').html('<i>' + message + '</i>');
	}

	// 处理原始的用户输入
	function processUserInput(chatApp, socket){
		var message = $('#send-message').val(),
			systemMessage;

		if(message.charAt(0) == '/'){
			// 如果用户输入的内容以斜杠开头，将其作为聊天命令处理
			systemMessage = chatApp.processCommand(message);

			if(systemMessage){
				$('#messages').append(divSystemContentElement(systemMessage));
			}
		}else{
			// 将非命令输入广播给其他用户
			chatApp.sendMessage($('#room').text(), message);
			$('#messages').append(divEscapedContentElement(message));
			$('#messages').scrollTop($('#messages').prop('scrollHeight'));
		}

		$('#send-message').val('');
	}

// Initialization...................................................................................

	var socket = io.connect();

	$(document).ready(function(){
		var chatApp = new Chat(socket);

		// 显示更名尝试的结果
		socket.on('nameResult', function(result){
			var message;

			if(result.success){
				message = 'You are now know as ' + result.name + '.';
			}else{
				message = result.message;
			}

			$('#messages').append(divSystemContentElement(message));
		});

		// 显示房间变更结果
		socket.on('joinResult', function(result){
			$('#room').text(result.room);
			$('#messages').append(divSystemContentElement('Room changed.'));
		});

		// 显示接收到的信息
		socket.on('message', function(message){
			var newElement = $('<div></div>').text(message.text);

			$('#messages').append(newElement);
		});

		// 显示可用房间列表
		socket.on('rooms', function(rooms){
			$('#room-list').empty();

			for(var room in rooms){
				room = room.substring(1, room.length);

				if(room != ''){
					$('#room-list').append(divEscapedContentElement(room));
				}
			}

			$('#room-list div').click(function(){
				chatApp.processCommand('/join ' + $(this).text());
				$('#send-message').focus();
			});
		});

		// 定期请求可用房间列表
		setInterval(function(){
			socket.emit('rooms');
		}, 1000);

		$('#send-message').focus();

		$('#send-form').submit(function(){
			processUserInput(chatApp, socket);
			return false;
		});
	});