const doesUserExist = async( prisma, email) => {
    const user = await prisma.users.findOne({
        where: {
            Email: email
        }
    });
    return user ? true : false;
};

module.exports = {
    doesUserExist
}