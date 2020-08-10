const { verifyUser } = require('../modules/jwt');

const addItem = async (parent, args, { prisma }) => {
    // const decode = verifyUser(args.token);
    // return await prisma.items.create({

    // })
};

const register = async (parent, args, { prisma }) => {
    // need to add bcrypt either here or the client
    const user = await prisma.users.create({
        FirstName: args.FirstName,
        LastName: args.LastName,
        Email: args.Email,
        Password: args.Password
    });
    
    if (user) {
        return {
            token: await signJWT(args.Email)
        }
    }

    return "Error";
};

module.exports = {
    addItem,
    register,
}