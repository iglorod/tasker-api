const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const tryAgainMessage = 'Something went wrong... Please, try again later';

exports.signup = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (user)
                return res.status(409).json({
                    message: 'Entered Email address is already registered'
                });

            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err)
                    return res.status(500).json({
                        message: tryAgainMessage
                    });

                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.email,
                    password: hash
                })

                user.save()
                    .then(user => {
                        const token = jwt.sign(
                            {
                                id: user._id,
                                email: user.email
                            },
                            process.env.JWT_KEY,
                            {
                                expiresIn: '1h'
                            }
                        );
                        res.status(200).json(token);
                    })
                    .catch(err => res.status(500).json({
                        message: tryAgainMessage
                    }));
            })
        })
        .catch(err => res.status(500).json({
            message: tryAgainMessage
        }));
};

exports.signin = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (!user)
                return res.status(401).json({
                    message: 'Entered data is incorrect'
                });

            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err)
                    return res.status(401).json({
                        message: tryAgainMessage
                    });

                if (result) {
                    const token = jwt.sign(
                        {
                            id: user._id,
                            email: user.email
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: '1h'
                        }
                    );
                    return res.status(200).json(token);
                }

                return res.status(401).json({
                    message: tryAgainMessage
                });
            })
        })
        .catch(err => res.status(500).json({
            message: tryAgainMessage
        }));
};

exports.emailExists = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            return res.status(200).json(user);
        })
        .catch(err => res.status(500).json({ error: err }))
}

exports.refreshToken = (req, res, next) => {
    const payload = jwt.decode(req.body.token);

    User.findOne({ _id: payload.id, email: payload.email})
    .exec()
    .then(user => {
        if (!user) {
            return res.status(401).json({
                message: tryAgainMessage
            })
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_KEY,
            {
                expiresIn: '1h'
            }
        );
        return res.status(200).json(token);

    })
    .catch(err => res.status(500).json({
        message: tryAgainMessage
    }))
}
