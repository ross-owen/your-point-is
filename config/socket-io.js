const {Server} = require('socket.io');
const sharedSession = require('express-socket.io-session');
const Vote = require('../models/Vote');

module.exports = (httpServer, sessionMiddleware) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    io.use(
        sharedSession(sessionMiddleware, {
            autoSave: true,
        })
    );

    if (!io.onlineUsers) {
        io.onlineUsers = new Map();
    }
    if (!io.roomParticipants) {
        io.roomParticipants = new Map();
    }
    if (!io.roomState) {
        io.roomState = new Map();
    }

    io.on('connection', (socket) => {
        console.log(
            `Socket.IO: Raw connection. Socket ID: ${socket.id}, Session ID: ${socket.handshake.sessionID}`
        );

        // Handle the "connect" event (fires on initial connect and any reconnect)
        socket.on('connect', () => {
            console.log(`Socket.IO: Socket ID ${socket.id} re-connected.`);
        });

        // Handle the "reconnect" event (fires specifically after a temporary disconnect)
        socket.on('reconnect', (attemptNumber) => {
            console.log(
                `Socket.IO: Socket ID ${socket.id} successfully reconnected on attempt #${attemptNumber}.`
            );
        });

        // Listen for the "join_room" event from the client
        socket.on('join_room', (roomName, name) => {
            console.log(`${name} is joining room ${roomName}`);
            if (roomName && typeof roomName === 'string' && roomName.trim() !== '') {
                // --- User Identification Logic (NOW simplified, always guest-like) ---
                const userId = socket.handshake.sessionID; // Session ID is the persistent identifier for this "guest"
                let displayName = name;

                // Check if a display name is already stored in the session for this guest
                if (!displayName && socket.handshake.session.socketDisplayName) {
                    displayName = socket.handshake.session.socketDisplayName;
                } else {
                    socket.handshake.session.socketDisplayName = displayName;
                }

                // Attach user data directly to the socket.data object for later use
                socket.data = {
                    userId: userId,
                    displayName: displayName,
                    isAuth: false, // Always false in this setup
                    rooms: [roomName],
                };

                // Add the actual socket to the specified room
                socket.join(roomName);

                // Add the user (by userId/sessionID) to the room"s participant list
                if (!io.roomParticipants.has(roomName)) {
                    io.roomParticipants.set(roomName, new Map());
                }
                io.roomParticipants.get(roomName).set(userId, 'waiting');

                console.log(
                    `User "${displayName}" (ID: ${userId}, Socket: ${socket.id}) joined room: "${roomName}"`
                );

                // Send confirmation back to the joining client
                socket.emit(
                    'room_joined_confirmation',
                    `You have joined room: ${roomName}`
                );

                // Add the current socket.id to the set of active sockets for this user ID
                if (!io.onlineUsers.has(userId)) {
                    io.onlineUsers.set(userId, new Set());
                }
                io.onlineUsers.get(userId).add(socket.id);
                console.log(
                    `Active sockets for User "${displayName}" (ID: ${userId}): ${Array.from(
                        io.onlineUsers.get(userId)
                    ).join(', ')}`
                );

                // Prepare the updated list of participants for this room (using their display names)
                const currentParticipantsInRoom = Array.from(
                    io.roomParticipants.get(roomName)
                ).map(([participantId, status]) => {
                    // Try to resolve userId back to displayName from currently active sockets
                    // This relies on `socket.data` being set on a connected socket.
                    if (io.onlineUsers.has(participantId)) {
                        const firstSocketId = Array.from(
                            io.onlineUsers.get(participantId)
                        )[0];
                        const participantSocket = io.sockets.sockets.get(firstSocketId);
                        return participantSocket && participantSocket.data
                            ? [participantSocket.data.displayName, status]
                            : [participantId, status];
                    }
                    return [participantId, status]; // Fallback
                });

                const currentRoomState = io.roomState.get(roomName);
                console.log('current room state: ' + currentRoomState);

                if (currentRoomState === 'voting') {
                    // Put the new joiner directly into the voting state
                    io.roomParticipants.get(roomName).set(userId, 'voting');

                    io.to(room).emit('started_new_round', {
                        sender: displayName,
                        userId: userId,
                        room: roomName,
                        participants: currentParticipantsInRoom,
                    });
                }

                // Broadcast to all clients in the room (including the sender) about the join
                io.to(roomName).emit('participants', {
                    message: `${displayName} has joined ${roomName}.`,
                    user: {id: userId, displayName: displayName, isAuth: false},
                    participants: currentParticipantsInRoom, // Send updated participant list
                });
            } else {
                console.warn(
                    `Socket ID ${socket.id} tried to join an invalid room name: "${roomName}".`
                );
                socket.emit('error_message', 'Invalid room name provided.');
            }
        });

        // listen for a new round request from the room owner
        socket.on('new_round', (room) => {
            io.roomState.set(room, 'voting');
            
            const {userId, displayName} = socket.data;

            console.log(
                `Start a new round message to room "${room}" from "${displayName}" (ID: ${userId}, Socket: ${socket.id})"`
            );

            for (const [userId] of io.roomParticipants.get(room)) {
                io.roomParticipants.get(room).set(userId, 'voting');
            }

            // Prepare the updated list of participants for this room (using their display names)
            const currentParticipantsInRoom = Array.from(
                io.roomParticipants.get(room)
            ).map(([participantId, status]) => {
                // Try to resolve userId back to displayName from currently active sockets
                // This relies on `socket.data` being set on a connected socket.
                if (io.onlineUsers.has(participantId)) {
                    const firstSocketId = Array.from(
                        io.onlineUsers.get(participantId)
                    )[0];
                    const participantSocket = io.sockets.sockets.get(firstSocketId);
                    return participantSocket && participantSocket.data
                        ? [participantSocket.data.displayName, status]
                        : [participantId, status];
                }
                return [participantId, status]; // Fallback
            });

            // Emit the message ONLY to clients in that specific room
            io.to(room).emit('started_new_round', {
                sender: displayName,
                userId: userId,
                room: room,
                participants: currentParticipantsInRoom,
            });
        });

        // listen for voting
        socket.on('voting', async (data) => {
            try {
                const {room, vote} = data;
                const {userId, displayName} = socket.data;
                const sessionId = socket.handshake.sessionID;

                // --- Validate room membership ---
                if (!room || !io.roomParticipants.has(room)) {
                    console.warn(`Invalid room '${room}' from ${displayName}`);
                    return socket.emit('error', 'Invalid room.');
                }

                const participants = io.roomParticipants.get(room);

                // Check that this user is actually part of the room
                if (!participants.has(userId) || !socket.rooms.has(room)) {
                    console.warn(`User ${displayName} (${userId}) tried to vote in unauthorized room ${room}`);
                    socket.emit('error', 'Unauthorized voting attempt.');
                    // Optionally boot the user:
                    socket.leave(room);
                    socket.disconnect(true);
                    return;
                }

                // --- Sanitize vote input ---
                if (typeof vote !== 'number' && typeof vote !== 'string') {
                    console.warn(`Invalid vote type from ${displayName}`);
                    return socket.emit('error', 'Invalid vote.');
                }

                console.log(
                    `${displayName} voted ${vote} in room ${room} using session ${sessionId} and userId ${userId}`
                );

                await saveVote(room, sessionId, displayName, vote);

                let remove = !vote;
                participants.set(userId, remove ? 'voting' : 'voted');

                // --- Prepare updated participant list ---
                const currentParticipantsInRoom = Array.from(participants).map(([participantId, status]) => {
                    if (io.onlineUsers.has(participantId)) {
                        const firstSocketId = Array.from(io.onlineUsers.get(participantId))[0];
                        const participantSocket = io.sockets.sockets.get(firstSocketId);
                        return participantSocket && participantSocket.data
                            ? [participantSocket.data.displayName, status]
                            : [participantId, status];
                    }
                    return [participantId, status];
                });

                io.to(room).emit('user_voted', {
                    displayName,
                    remove,
                    participants: currentParticipantsInRoom,
                });
            } catch (err) {
                console.error('Error handling vote:', err);
                socket.emit('error', 'Server error.');
            }
        });

        // listen for a pass vote
        socket.on('pass_vote', async (data) => {
            const {room, vote} = data;
            const {userId, displayName} = socket.data;
            const sessionId = socket.handshake.sessionID;

            let remove = true;
            // set the status to voting temporarily to reset any voted cards
            await saveVote(room, sessionId, displayName, vote);
            io.roomParticipants.get(room).set(userId, 'passing');


            // Prepare the updated list of participants for this room (using their display names)
            const currentParticipantsInRoom = Array.from(
                io.roomParticipants.get(room)
            ).map(([participantId, status]) => {
                // Try to resolve userId back to displayName from currently active sockets
                // This relies on `socket.data` being set on a connected socket.
                if (io.onlineUsers.has(participantId)) {
                    const firstSocketId = Array.from(
                        io.onlineUsers.get(participantId)
                    )[0];
                    const participantSocket = io.sockets.sockets.get(firstSocketId);
                    return participantSocket && participantSocket.data
                        ? [participantSocket.data.displayName, status]
                        : [participantId, status];
                }
                return [participantId, status]; // Fallback
            });

            io.to(room).emit('user_voted', {
                displayName: displayName,
                remove: remove,
                participants: currentParticipantsInRoom,
            });
        });

        // listen for collect votes
        socket.on('collect_votes', async (room) => {
            io.roomState.set(room, 'revealing');
            console.log(`Collecting votes for room "${room}"`);
            const votes = await getVotes(room);
            console.log(votes);
            for (const [userId] of io.roomParticipants.get(room)) {
                io.roomParticipants.get(room).set(userId, 'voting');
            }

            io.to(room).emit('voted', votes);
        });

        // Handle socket disconnection
        socket.on('disconnect', (reason) => {
            // Check if socket.data was ever populated (meaning they joined a room)
            const userId = socket.data?.userId || `unknown_${socket.id}`;
            const displayName =
                socket.data?.displayName || `Unknown User (${socket.id})`;
            console.log(socket.data.rooms);
            console.log(
                `User "${displayName}" (ID: ${userId}) disconnected. Socket ID: ${socket.id}. Reason: ${reason}`
            );

            // Remove the disconnected socket ID from the user"s active sockets set
            if (io.onlineUsers.has(userId)) {
                io.onlineUsers.get(userId).delete(socket.id);

                // If the user has no more active sockets, consider them fully offline
                if (io.onlineUsers.get(userId).size === 0) {
                    io.onlineUsers.delete(userId);
                    console.log(
                        `User "${displayName}" (ID: ${userId}) is now fully offline.`
                    );

                    // Iterate through all rooms the disconnected socket *was* in
                    socket.data.rooms.forEach((room) => {
                        if (room !== socket.id && io.roomParticipants.has(room)) {
                            // Exclude the default self-room
                            let userHasOtherSocketsInThisRoom = false;
                            // Check if this user has any other active sockets still in this particular room
                            if (io.onlineUsers.has(userId)) {
                                for (const otherSocketId of io.onlineUsers.get(userId)) {
                                    const otherSocket = io.sockets.sockets.get(otherSocketId);
                                    if (otherSocket && otherSocket.rooms.has(room)) {
                                        userHasOtherSocketsInThisRoom = true;
                                        break;
                                    }
                                }
                            }

                            // If no other socket for this user is in this room, remove user from room participants
                            if (!userHasOtherSocketsInThisRoom) {
                                io.roomParticipants.get(room).delete(userId);
                                if (io.roomParticipants.get(room).size === 0) {
                                    io.roomParticipants.delete(room);
                                }
                                console.log(
                                    `User "${displayName}" (ID: ${userId}) removed from room "${room}" participants.`
                                );

                                // Prepare the updated list of participants for this room
                                const currentParticipantsInRoom = io.roomParticipants.has(room)
                                    ? Array.from(io.roomParticipants.get(room)).map(
                                        ([participantId, status]) => {
                                            if (io.onlineUsers.has(participantId)) {
                                                const firstSocketId = Array.from(
                                                    io.onlineUsers.get(participantId)
                                                )[0];
                                                const participantSocket =
                                                    io.sockets.sockets.get(firstSocketId);
                                                return participantSocket && participantSocket.data
                                                    ? [participantSocket.data.displayName, status]
                                                    : [participantId, status];
                                            }
                                            return [participantId, status];
                                        }
                                    )
                                    : [];

                                // Broadcast to the room that the user has left
                                io.to(room).emit('participants', {
                                    message: `${displayName} has left ${room}.`,
                                    user: {id: userId, displayName: displayName, isAuth: false},
                                    participants: currentParticipantsInRoom,
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    console.log(
        'Socket.IO initialized and listening for connections on the HTTP server.'
    );

    return io; // Return the io instance if you need to use it elsewhere
};

async function saveVote(roomCode, sessionId, displayName, vote) {
    if (vote) {
        await Vote.findOneAndUpdate(
            {
                roomCode: roomCode,
                sessionId: sessionId,
            },
            {
                vote: vote,
                displayName: displayName,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );
    } else {
        await Vote.deleteOne({roomCode: roomCode, sessionId: sessionId});
    }
}

async function getVotes(roomCode) {
    const votes = await Vote.find({roomCode: roomCode});
    await Vote.deleteMany({roomCode: roomCode});
    return votes.map((v) => {
        return {
            name: v.displayName,
            card: v.vote,
        };
    });
}
