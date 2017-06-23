var socketio = require('socket.io'),

	io,
	guestNumber = 1,
	nickNames = {},
	namesUsed = [],
	currentRoom = {};

// Functions......................................................................................

	// 分配用户昵称
	function assignGuestName(socket, guestNumber, nickNames, namesUsed){
		var name = 'Guest' + guestNumber; // 生成新的昵称

		// 把用户昵称跟客户端连接ID关联上
		nickNames[socket.id] = name;
		// 让用户知道他们的昵称
		socket.emit('nameResult', {
			success: true,
			name: name
		});
		// 存放已经被占用的昵称
		namesUsed.push(name);

		return guestNumber + 1; // 增加用来生成昵称的计数器
	}

	// 加入聊天室
	function joinRoom(socket, roomName){
		// 让用户进入房间
		socket.join(roomName);
		// 记录用户的当前房间
		currentRoom[socket.id] = roomName;
		// 让用户知道他们进入了新的房间
		socket.emit('joinResult', {
			room: roomName
		});
		// 让房间里的其他用户知道有新用户进入了房间
		socket.broadcast.to(roomName).emit('message', {
			text: nickNames[socket.id] + ' has joined ' + roomName + '.'
		});

		// 房间中的用户数组
		var usersInRoom = io.sockets.clients(roomName);
		if(usersInRoom.length > 1){
			// 如果不知一个用户在这个房间里，汇总下都有谁
			var usersInRoomSummary = 'Users currently in ' + roomName + ': ';
			for(var index in usersInRoom){
				var userSocketId = usersInRoom[index].id;
				if(userSocketId != socket.id){
					if(index > 0) usersInRoomSummary += ', ';
					usersInRoomSummary += nickNames[userSocketId];
				}
			}

			usersInRoomSummary += '.';

			// 将房间里其他用户的汇总发送给这个用户
			socket.emit('message', {
				text: usersInRoomSummary
			});
		}
	}

	// 发送聊天消息
	function handleMessageBroadcasting(socket){
		socket.on('message', function(message){
			socket.broadcast.to(message.room).emit('message', {
				text: nickNames[socket.id] + ': ' + message.text
			});
		});
	}

	// 创建房间
	function handleRoomJoining(socket){
		socket.on('join', function(room){
			socket.leave(currentRoom[socket.id]);
			joinRoom(socket, room.newRoom);
		});
	}

	// 用户断开连接
	function handleClientDisconnection(socket){
		socket.on('disconnect', function(){
			var nameIndex = namesUsed.indexOf(nickNames[socket.id]);

			delete namesUsed[nameIndex];
			delete nickNames[socket.id];
		});
	}

	// 处理昵称变更请求
	function handleNameChangeAttempts(socket, nickNames, namesUsed){
		// 添加nameAttempt事件的监听器
		socket.on('nameAttempt', function(name){
			if(name.indexOf('Guest') == 0){
				// 昵称不能以Guest开头
				socket.emit('nameResult', {
					success: false,
					message: 'Names cannot begin with "Guest".'
				});
			}else{
				if(namesUsed.indexOf(name) == -1){
					// 如果昵称还没注册就注册上
					var previousName = nickNames[socket.id],
						previousNameIndex = namesUsed.indexOf(previousName);

					namesUsed.push(name);
					nickNames[socket.id] = name;

					// 删掉之前用的昵称，让其他用户可以使用
					delete namesUsed[previousNameIndex];

					socket.emit('nameResult', {
						success: true,
						name: name
					});

					socket.broadcast.to(currentRoom[socket.id]).emit('message', {
						text: previousName + ' is now know as ' + name + '.'
					});
				}else{
					// 如果昵称已经被占用，给客户端发送错误消息
					socket.emit('message', {
						success: false,
						message: 'That name is already in use.'
					});
				}
			}
		});
	}

// Exports........................................................................................

	exports.listen = function(server){
		// 启动Socket.IO服务器，允许它搭载在已有的HTTP服务器上
		io = socketio.listen(server);
		io.set('log level', 1);

		// 定义每个用户连接的处理逻辑
		io.sockets.on('connection', function(socket){
			// 在用户连接上来时赋予其一个访客名
			guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
			// 在用户连接上来时把他放入聊天室Lobby里
			joinRoom(socket, 'Lobby');

			// 处理用户的消息，更名，以及聊天室的创建和变更
			handleMessageBroadcasting(socket, nickNames);
			handleNameChangeAttempts(socket, nickNames, namesUsed);
			handleRoomJoining(socket);

			// 用户发出请求时，向其提供已经被占用的聊天室列表
			socket.on('rooms', function(){
				socket.emit('rooms', io.sockets.manager.rooms);
			});

			// 定义用户断开连接后的清除逻辑
			handleClientDisconnection(socket, nickNames, namesUsed);
		});
	};