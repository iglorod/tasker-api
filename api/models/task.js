const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    ownersId: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    invintations: [
        {
            sender: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
            reciver: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' }
        }
    ],
    lastUpdateDate: { type: String, required: true },
    instructions: { type: Array, required: true },
})

module.exports = mongoose.model('Task', taskSchema);
