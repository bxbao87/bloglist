const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const logger = require('../utils/logger')

blogRouter.get('/',  async (request, response) => {
    let blogs = await Blog
        .find({}).populate('user', {
            username: 1,
            name: 1,
        })
    response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
    const body = request.body
    // logger.info(request.token)

    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    // logger.info(decodedToken)

    if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid '})
    } 

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: user.id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {    
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) // no user id
        return response.status(401).json({ error: 'token invalid' })

    const user = await User.findById(decodedToken.id)
    if (!user)
        return response.status(401).json({ error: 'token invalid' })

    const id = request.params.id
    const blog = await Blog.findById(id)
    if (!blog) // no blog
        return response.status(400).send({ error: 'invalid id' })

    if (blog.user.toString() !== user.id.toString()) // no permission
        return response.status(403).send({ error: 'Only creator can delete'})
        
    await Blog.findByIdAndRemove(id) // remove it

    user.blogs = user.blogs.filter(id => id !== blog.id) // save user blogs
    await user.save()

    response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
    const id = request.params.id
    const body = request.body

    const blog = {
        "title": body.title,
        "author": body.author,
        "url": body.url,
        "likes": body.likes
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        id, blog, { new: true, runValidators: true, context: 'query' }
    )

    response.json(updatedBlog)
})

module.exports = blogRouter