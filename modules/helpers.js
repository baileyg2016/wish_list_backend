const doesUserExist = async( prisma, email) => {
    const user = await prisma.users.findOne({
        where: {
            email: email
        }
    });
    return user ?? null;
};

module.exports = {
    doesUserExist
}