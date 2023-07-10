const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * GET /
 * HOME
*/
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "NodeJs Blog",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    let perPage = 3;
    let page = req.query.page || 1;

    const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Post.countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', {
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      previousPage: page > 1 ? parseInt(page) - 1 : null,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * Post :id
*/
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;


    

    const data = await Post.findById({ _id: slug });
    const comments = await Comment.find({ post: slug });

   

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    
    
    }
    

    res.render('post', { 
      locals,
      data,
      comments,
     
      currentRoute: `/post/${slug}`
    });
  } catch (error) {
    console.log(error);
  }

});

router.post('/post/:id/comment', async (req, res) => {
  try {
    const postId = req.params.id;
    const { name, email, comment } = req.body;
  

    const newComment = new Comment({
      name,
      email,
      comment,
      post: postId
    });

    const savedComment = await newComment.save(); 

    // Fetch the newly added comment
    const addedComment = await Comment.findById(savedComment._id);

    // Render the new comment
    const commentMarkup = `
      <div class="card comment-card">
        <div class="card-body">
          <h4 class="card-title"><strong>${addedComment.name}</strong></h4>
          <p class="card-text">${addedComment.comment}</p>
        </div>
      </div>
    `;

    // Send the new comment markup as the response
    res.send(commentMarkup);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred while saving the comment.');
  }
});


/**
 * POST /
 * Post - searchTerm
*/
router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: "Seach",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { image: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      data,
      locals,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * About
*/
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about'
  });
});


//  function insertPostData () {
//   Post.insertMany([
//     {
//     title: "Iron Man",
//     body: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.",
//     image: "iron_man.jpg"
//   },
//   {
//     title: "The Avengers",
//     body: "Earth's mightiest heroes must come together and learn to fight as a team to stop the mischievous Loki and his alien army from enslaving humanity.",
//     image: "the_avengers.jpg"
//   },
//   {
//     title: "Captain America: The Winter Soldier",
//     body: "As Steve Rogers struggles to embrace his role in the modern world, he teams up with a fellow Avenger and S.H.I.E.L.D agent, Black Widow, to battle a new threat.",
//     image: "captain_america_winter_soldier.jpg"
//   },
//   {
//     title: "Guardians of the Galaxy",
//     body: "A group of intergalactic criminals are forced to work together to stop a fanatical warrior from taking control of the universe.",
//     image: "guardians_of_the_galaxy.jpg"
//   },
//   {
//     title: "Thor: Ragnarok",
//     body: "Imprisoned on the planet Sakaar, Thor must race against time to prevent the destruction of Asgard at the hands of the ruthless Hela.",
//     image: "thor_ragnarok.jpg"
//   },
//   {
//     title: "Black Panther",
//     body: "T'Challa, the newly crowned king of Wakanda, must defend his land from being torn apart by enemies from within and outside the country.",
//     image: "black_panther.jpg"
//   }
//    ])
//  }
//  insertPostData();


module.exports = router;