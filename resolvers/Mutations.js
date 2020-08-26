const { verifyUser, signJWT } = require('../modules/jwt');
const { doesUserExist } = require('../modules/helpers');
const { ApolloError } = require('apollo-server');

const addItem = async (parent, args, { prisma }) => {
    const decode = verifyUser(args.token);
    if (!doesUserExist(prisma, args.Email)) {
        return "User does not exist"
    }
    
    const record = await prisma.items.create({
        Name: args.Name,
        url: args.url,
        ImageURL: args.ImageURL,
        Cost: args.Cost,
        Size: args.Size,
        user: {
            connect: {
                where: { Email: args.Email }
            }
        }
    });

    console.log(record)

    return {
        id: record.pkItem
    }
};

const register = async (parent, args, { prisma }) => {
    // need to add bcrypt either here or the client
    let user;
    try {
        console.log(args)
        user = await prisma.users.create({
            data: {
                FirstName: args.FirstName,
                LastName: args.LastName,
                Email: args.Email,
                Password: args.Password
            }
        });
    } catch(err) {
        console.error(err);
        return new ApolloError("Database error registering user");
    }
    
    if (user) {
        return {
            jwt: await signJWT(args.Email),
            firstName: args.FirstName,
            fastName: args.LastName,
        }
    }
};

module.exports = {
    addItem,
    register,
}