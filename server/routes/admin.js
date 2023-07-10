const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

/**
 * 
 * Check Login
*/
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId); // Retrieve the user from the database
    req.user = { id: decoded.userId, username: user.username }; // Assign the user object with the user ID and username
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

/**
 * GET /
 * Admin - Login Page
 */
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: 'Admin',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.', 
    };

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});
/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );

    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
    

  } catch (error) {
    console.log(error);
  }
});
/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.',
      userIsAuthenticated: true,
      username: username // Pass the username to the view
    };

    const data = await Post.find({ userId: userId });

    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });
  } catch (error) {
    console.log(error);
  }
});
/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  const username = req.user.username;

  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.',
      userIsAuthenticated: true,
      username: username 
    };

    const data = await Post.find();
   
    res.render('admin/add-post', {
      locals,
      data,
      layout: adminLayout
    });
  } catch (error) {
    console.log(error);
  }

});
/**
 * POST /
 * Admin - Create New Post
*/
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    const { title, image, body } = req.body;
    const userId = req.user.id;

    const newPost = new Post({
      title,
      image, // Make sure the image URL is stored in the image field
      body,
      userId
    });

    await newPost.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});
/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const username = req.user.username;

    const locals = {
      title: "Edit Post",
      description: "Free NodeJs User Management System",
      userIsAuthenticated: true,
      username: username 
      
     
    }

    const data = await Post.findOne({ _id: postId, userId: userId });

    if (!data) {
      // If the post does not belong to the logged-in user, return an error or redirect to a suitable page
      return res.status(404).json({ message: 'Post not found' });
    }
   
    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});
/**
 * PUT /
 * Admin - Create New Post
*/
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const updatedPost = await Post.findOneAndUpdate({ _id: postId, userId: userId }, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    if (!updatedPost) {
      // If the post does not belong to the logged-in user, return an error or redirect to a suitable page
      return res.status(404).json({ message: 'Post not found' });
    }

    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create the user
      const user = await User.create({ username, password: hashedPassword });

      // Generate a JWT token for the user
      const token = jwt.sign({ userId: user._id }, jwtSecret);

      // Set the token as a cookie
      res.cookie('token', token, { httpOnly: true });

      res.redirect('/'); // Redirect to the dashboard or any other desired page
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ message: 'User already in use' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  } catch (error) {
    console.log(error);
  }
});

/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const deletedPost = await Post.findOneAndDelete({ _id: postId, userId: userId });

    if (!deletedPost) {
      // If the post does not belong to the logged-in user, return an error or redirect to a suitable page
      return res.status(404).json({ message: 'Post not found' });
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});


router.get('/auth/check-login', authMiddleware, (req, res) => {
  // If the execution reaches this point, the user is authenticated
  res.json({ userIsAuthenticated: true });
});




/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});


module.exports = router;