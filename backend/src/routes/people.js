const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const peopleController = require('../controllers/peopleController');

// Public — used by kiosk to resolve NIF to name
router.get('/lookup', peopleController.lookup);

// Admin-only endpoints
router.get('/',        auth, peopleController.list);
router.post('/',       auth, peopleController.create);
router.put('/:id',     auth, peopleController.update);
router.delete('/:id',  auth, peopleController.remove);

module.exports = router;
