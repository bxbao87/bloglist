var _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((acc, blog) => acc+blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    return blogs.reduce((ret, blog) => {
        if (ret === null || ret.likes < blog.likes)
            return blog

        return ret
    }, null)
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0)
        return null

    let ret = _.countBy(blogs, "author")    
    ret = _.entries(ret)
    ret = _.maxBy(ret, 
                function(o) {
                    return o[1];
                })
    
    return { "author": ret[0], "blogs": ret[1] };
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs
}