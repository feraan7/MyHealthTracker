const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

const serializeUser = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    badges: user.badges || [],
    streakCount: user.streakCount || 0,
    totalPoints: user.totalPoints || 0,
    height: user.height,
    weight: user.weight,
    goals: user.goals,
    token: generateToken(user._id)
});

const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const validateBodyMetrics = ({ height, weight }) => {
    if (height !== undefined && (height < 50 || height > 250)) {
        return 'Height must be between 50 and 250 cm';
    }

    if (weight !== undefined && (weight < 10 || weight > 300)) {
        return 'Weight must be between 10 and 300 kg';
    }

    return null;
};

const register = async (req, res) => {
    const { name, email, password, height, weight } = req.body;

    try {
        const parsedHeight = parseOptionalNumber(height);
        const parsedWeight = parseOptionalNumber(weight);
        const metricsError = validateBodyMetrics({
            height: parsedHeight,
            weight: parsedWeight
        });

        if (metricsError) {
            return res.status(400).json({ message: metricsError });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            height: parsedHeight,
            weight: parsedWeight
        });
        return res.status(201).json(serializeUser(user));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.json(serializeUser(user));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    serializeUser
};
