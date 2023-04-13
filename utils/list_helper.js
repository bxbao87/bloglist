var _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    if (!blogs) return 0
    return blogs.reduce((acc, blog) => acc+blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    if (!blogs) return null

    return blogs.reduce((ret, blog) => {
        if (ret === null || ret.likes < blog.likes)
            return blog

        return ret
    }, null)
}

const mostBlogs = (blogs) => {
    if (!blogs || blogs.length === 0)
        return null

    let ret = _.countBy(blogs, "author")    
    ret = _.entries(ret)
    ret = _.maxBy(ret, 
                function(o) {
                    return o[1];
                })
    
    return { "author": ret[0], "blogs": ret[1] };
}

const mostLikes = (blogs) => {
    if (!blogs || blogs.length === 0)
        return null

    let groups = _.groupBy(blogs, "author")
    let likesPerAuthor = _.reduce(groups, function(result, value, key) {
        let tmp = {
            "author": key,
            "likes": _.sumBy(value, "likes")
        }
        
        return result.concat(tmp)
    }, [])

    return _.maxBy(likesPerAuthor, "likes")
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}