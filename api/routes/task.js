const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/check-auth');
const taskController = require('../controllers/tasks');

router.post('/', checkAuth, taskController.postTask);

router.get('/:taskId', checkAuth, taskController.getTask);

router.patch('/:taskId', checkAuth, taskController.patchTask);

router.patch('/share/:taskId', checkAuth, taskController.shareTask);

router.patch('/leave/:taskId', checkAuth, taskController.leaveTask);

router.get('/list/:ownerId', checkAuth, taskController.getTasks);

module.exports = router;
