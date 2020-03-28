const mongoose = require('mongoose');

const Task = require('../models/task');
const User = require('../models/user');

const userIsTaskMember = (taskId, newMemberId) => {
    return new Promise((resolve, reject) => {
        Task.findById(taskId)
            .then(task => {
                if (task.ownersId.includes('' + newMemberId)) resolve(true);
                resolve(false);
            })
            .catch(err => reject(err))
    })
}

const shareTask = (res, id, senderId, newMemberId) => {
    Task.updateOne({ _id: id }, {
        $push: {
            ownersId: newMemberId,
            invintations: {
                sender: senderId,
                reciver: newMemberId,
            }
        }
    })
        .exec()
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => res.status(500).json({ error: err }));
}

const removeTask = (res, taskId) => {
    Task.findByIdAndDelete(taskId)
        .then(() => {
            res.status(200).json({});
        })
        .catch(err => res.status(500).json({ error: err }));
}

const userLeaveTask = (res, task, userId) => {
    const ownersId = task.ownersId.filter(ownerId => ownerId != userId);

    const invintations = task.invintations.filter(invintaion => invintaion.reciver != userId);

    Task.updateOne({ _id: task._id }, { $set: { ownersId, invintations } })
        .then(() => {
            res.status(200).json({})
        })
        .catch((err) => res.status(500).json({ error: err }))
}

const getUserEmail = (id) => {
    return new Promise((resolve, reject) => {
        User.findById(id)
            .select('email')
            .then(user => {
                resolve(user.email);
            })
            .catch(err => console.log(err));
    })
}



/** CONTROLLERS */
exports.getTasks = (req, res, next) => {
    const ownerId = req.params.ownerId;

    Task.find({ ownersId: ownerId })
        .sort('-lastUpdateDate')
        .exec()
        .then(tasks => {
            let requests = tasks.map(task => {
                const invintaion = task.invintations.find(item => {
                    return item.reciver == ownerId;
                })
                
                if (!invintaion) return null;
                return getUserEmail(invintaion.sender);
            })

            Promise.all(requests)
                .then(responses => {
                    responses.forEach((email, index) => {
                        if (email) {
                            tasks[index]._doc.sender = email;
                        }
                    });

                    res.status(200).json(tasks);
                })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        });
};

exports.getTask = (req, res, next) => {
    const taskId = req.params.taskId;

    Task.findById(taskId)
        .exec()
        .then(task => {
            res.status(200).json(task);
        })
        .catch(err => res.status(500).json({ error: err }));
};

exports.postTask = (req, res, next) => {
    const task = new Task({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        description: req.body.description,
        lastUpdateDate: req.body.date,
        date: req.body.date,
        ownersId: [req.body.ownerId],
        instructions: req.body.instructions,
    });

    task.save()
        .then(task => {
            res.status(200).json(task);
        })
        .catch(err => res.status(500).json({ error: err }));
}

exports.patchTask = (req, res, next) => {
    const taskId = req.params.taskId;

    Task.findByIdAndUpdate(taskId, { $set: { ...req.body } })
        .then(() => {
            res.status(200).json({});
        })
        .catch(err => res.status(500).json({ error: err }));
}

exports.shareTask = (req, res, next) => {
    const id = req.params.taskId;
    const senderId = req.body.senderId;

    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            const newMemberId = user._id;

            userIsTaskMember(id, newMemberId)
                .then(result => {
                    if (result) {
                        return res.status(403).json({
                            message: 'User is already has this task'
                        });
                    }

                    shareTask(res, id, senderId, newMemberId);
                })
                .catch(err => res.status(500).json({ error: err }))
        })
        .catch(err => {
            return res.status(404).json({
                message: 'User with this E-mail was not found'
            })
        });
}

exports.leaveTask = (req, res, next) => {
    const taskId = req.params.taskId;
    const userId = req.body.userId;

    Task.findById(taskId)
        .then(task => {
            if (task.ownersId.length > 1) {
                return userLeaveTask(res, task, userId);
            } else {
                if (task.ownersId[0] == userId)
                    return removeTask(res, taskId);
                else return res.status(403);
            }
        })

}
/** CONTROLLERS */

