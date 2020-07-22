const users = async (parent, args, context) => {
    return await context.prisma.users.findMany()
}

module.exports = {
    users
}