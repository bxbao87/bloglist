const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const helper = require('./blog_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

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

describe('Update post', () => {
    test('exists in database, the likes will be updated', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogForUpdated = blogsAtStart[0]

        const newBlog = {
            likes: blogForUpdated.likes + 10
        }

        const response = await api
            .put(`/api/blogs/${blogForUpdated.id}`)
            .send(newBlog)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()
        const updatedBlog = blogsAtEnd.find(b => b.id === blogForUpdated.id)

        expect(updatedBlog.likes).toBe(newBlog.likes)
        expect(response.body.likes).toBe(newBlog.likes)

    }, 100000)

    test('does not exist in database, database has no changes', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const id = await helper.nonExistingId()
        const newBlog = {
            likes: 12321
        }

        const response = await api
            .put(`/api/blogs/${id}`)
            .send(newBlog)
            .expect(200)

        expect(response.body).toBe(null)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toStrictEqual(blogsAtStart)

    }, 100000)

    test('with existing id but invalid title and author, blog will not change', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogForUpdated = blogsAtStart[0]

        const newBlog = {
            title: "",
            likes: blogForUpdated.likes + 10
        }

        await api
            .put(`/api/blogs/${blogForUpdated.id}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        const updatedBlog = blogsAtEnd.find(b => b.id === blogForUpdated.id)

        expect(updatedBlog.title).toBe(blogForUpdated.title)
    }, 100000)
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('c0nf!d3nti@1', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'thomas',
            name: 'Thomas the Cat',
            password: 'Tom',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with status code 400 and message if username is already taken',
        async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'root',
                name: 'Thomas the Cat',
                password: 'Tom',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('expected `username` to be unique')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        }
    )

    test('creation fails with status code 400 and message if username is not at least 3 characters long',
        async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 't',
                name: 'Thomas the Cat',
                password: 'Tom',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Username must be at least 3 characters long')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        }
    )

    test('creation fails with status code 400 and message if username is not given',
        async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                name: 'Thomas the Cat',
                password: 'Tom',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Username is required')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        }
    )

    test('creation fails with status code 400 and message if password is not at least 3 characters long',
        async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'tom',
                name: 'Thomas the Cat',
                password: 'To',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Password must be at least 3 characters long')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        }
    )

    test('creation fails with status code 400 and message if password is not given',
        async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'tom',
                name: 'Thomas the Cat',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Password is required')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        }
    )

})

afterAll(async () => {
    await mongoose.connection.close()
})