const router = require('express').Router();
let User = require('../models/user.model');

router.route('/').get((req, res) => {
  User.find().select('-password')
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const username = req.body.username;
  const email = `${username}@fitkit.local`;
  const newUser = new User({ username, email, password: 'fitkit123' });

  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
