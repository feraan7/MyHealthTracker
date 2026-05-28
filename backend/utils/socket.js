const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance = null;

const initializeSocket = (server) => {
    ioInstance = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT']
        }
    });

    ioInstance.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            return next();
        } catch (error) {
            return next(new Error('Socket authentication failed'));
        }
    });

    ioInstance.on('connection', (socket) => {
        const userId = String(socket.user._id);
        socket.join(`user:${userId}`);

        if (socket.user.role === 'admin') {
            socket.join('admins');
        }

        socket.emit('socket:ready', {
            connected: true,
            userId,
            connectedAt: new Date().toISOString()
        });
    });

    return ioInstance;
};

const getSocketServer = () => ioInstance;

const emitUserEvent = (userId, event, payload) => {
    if (!ioInstance || !userId) return;
    ioInstance.to(`user:${userId}`).emit(event, payload);
}

const emitAdminEvent = (event, payload) => {
    if (!ioInstance) return;
    ioInstance.to('admins').emit(event, payload);
};

module.exports = {
    initializeSocket,
    getSocketServer,
    emitUserEvent,
    emitAdminEvent
};
