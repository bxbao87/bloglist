const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '')
    }

    return null
}

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
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
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
    const id = request.params.id
    await Blog.findByIdAndRemove(id)
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