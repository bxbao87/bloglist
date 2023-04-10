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
module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}