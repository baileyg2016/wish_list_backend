const { verifyUser, signJWT } = require('../modules/jwt');
const { doesUserExist } = require('../modules/helpers');
const { ApolloError } = require('apollo-server');
const { JsonWebTokenError } = require('jsonwebtoken');

const addItem = async (parent, args, { prisma, token }) => {
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error decoding token');
    }

    if (!doesUserExist(prisma, decode.data.email)) {
        return new AuthenticationError('User does not exits');
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

const deleteItem = async (parent, args, { prisma, token }) => {
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error decoding token');
    }

    if (!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }

    const success = await prisma.items.delete({
        where: { pkItem: args.pkItem }
    });

    if (!success) {
        return false;
    }
    return true;
};

const addFriend = async (parent, args, { prisma, token }) => {
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error decoding token');
    }

    if (!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }

    const friendship = await prisma.friends.create({
        data: {
            users_friends_User1IDTousers: {
                connect: { pkUser: decoded.data.pk },
            },
            users_friends_User2IDTousers: {
                connect: { pkUser: args.pkFriend },
            },
        }
    });

    if (!friendship) {
        return new ApolloError('Houston we have a problem');
    }
    
    return friendship.pkFriend;
};

const unFriend = async (parent, args, { prisma, token }) => {
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error decoding token');
    }

    if (!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }

    const sad = await prisma.friends.delete({
        where: {
            pkFriend: args.pkFriend
        }
    });

    if (!sad) {
        return false;
    }
    
    return true;
};

module.exports = {
    addItem,
    register,
    deleteItem,
    addFriend,
    unFriend
}