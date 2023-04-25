const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./blog_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
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

test('a valid blog can be added', async () => {
    const newBlog = {
        "title": "Fullstackopen",
        "author": "University of Helsinki",
        "url": "https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12",
        "likes": 9999
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const titles = blogsAtEnd.map(b => b.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain(
        'Fullstackopen'
    )
}, 100000)

test('if the likes property is missing from the request, it will default to the value 0',
    async () => {
        const newBlog = {
            "title": "Fullstackopen",
            "author": "University of Helsinki",
            "url": "https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12",
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        const newBlogSaved = blogsAtEnd.find(b => b.title === "Fullstackopen")
        expect(newBlogSaved.likes).toBe(0)
    }, 100000
)

describe("creating new blogs with response status code 400", () => {
    test('if the title property is missing', async () => {
        const newBlog = {
            "author": "University of Helsinki",
            "url": "https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12",
            "likes": 123456
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)
            
    }, 100000)

    test('if the author property is missing', async () => {
        const newBlog = {
            "title": "Testing the backend",
            "url": "https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12",
            "likes": 123457
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)
            
    }, 100000)
})

describe('delete a single blog post resource', () => {
    test('succeeds with status code 204 and the number of blogs reduces 1 if id exists', 
    async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

        const ids = blogsAtEnd.map(b => b.id)
        expect(ids).not.toContain(blogToDelete.id)
    }, 100000)

    test('succeeds with status code 204 and the number of blogs stays remain if id does not exist', 
    async () => {
        const blogsAtStart = await helper.blogsInDb()

        const id = await helper.nonExistingId()

        await api
            .delete(`/api/blogs/${id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        const ids = blogsAtEnd.map(b => b.id)
        expect(ids).not.toContain(id)
    }, 100000)
})

afterAll(async () => {
    await mongoose.connection.close()
})