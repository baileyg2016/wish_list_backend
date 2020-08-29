const { verifyUser, signJWT } = require('../modules/jwt');
const { doesUserExist } = require('../modules/helpers');
const { ApolloError } = require('apollo-server');

const addItem = async (parent, args, { prisma, token }) => {
    const decode = verifyUser(token);
    if (!doesUserExist(prisma, decode.data.email)) {
        return "User does not exist"
    }
    
    const record = await prisma.items.create({
        data: {
            Name: args.Name,
            url: args.url,
            ImageURL: args.ImageURL,
            Cost: args.Cost,
            Size: args.Size,
            users: { // getting an error with this
                connect: {
                    pkUser: decode.data.pk
                }
            }
        }
    });
    
    return record.pkItem
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
            jwt: await signJWT({ email: args.Email, pk: user.pkUser }),
            firstName: args.FirstName,
            fastName: args.LastName,
        }
    }
};

const deleteItem = async (parent, args, { prisma }) => {
    const decoded = verifyUser(args.token);
    if (!decoded) {
        return new AuthenticationError('User does not exist');
    }

    const success = prisma.items.deleteItem({
        where: { pkUser: args.ItemId }
    });

    if (success) {
        return true;
    }
    return false;
};

module.exports = {
    addItem,
    register,
    deleteItem
}