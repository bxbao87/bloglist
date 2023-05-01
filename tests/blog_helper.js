const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        "title": "A Brief History of Time",
        "author": "Stephen Hawking",
        "url": "https://en.wikipedia.org/wiki/A_Brief_History_of_Time",
        "likes": 1001
    },
    {
        "title": "Doraemon",
        "author": "Fujiko Fujio",
        "url": "https://en.wikipedia.org/wiki/Doraemon_(character)",
        "likes": 1000
    }
]

const nonExistingId = async () => {
    const blog = new Blog({
        "title": "Cracking the Coding Interview",
        "author": "McDowell",
        "url": "https://en.wikipedia.org/wiki/Cracking_the_Coding_Interview",
        "likes": 1234
    })
    await blog.save()
    await blog.deleteOne()

    return blog._id.toString()
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    initialBlogs,
    nonExistingId,
    blogsInDb,
    usersInDb
}