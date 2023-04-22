const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

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

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(initialBlogs)
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
}, 100000)

test('unique identifier property of the blog posts is named id', async () => {
    let response = await api.get('/api/blogs')
    let blogs = response.body
    for (let blog of blogs) {
        expect(blog.id).toBeDefined()
    }
}, 100000)

afterAll(async () => {
    await mongoose.connection.close()
})