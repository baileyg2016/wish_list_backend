const { verifyUser, signJWT } = require('../modules/jwt');
const { doesUserExist } = require('../modules/helpers');
const { ApolloError } = require('apollo-server');
const { JsonWebTokenError } = require('jsonwebtoken');

const addItem = async (parent, args, { prisma, token }) => {
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error decoding token');
    }

    if (!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }
    
    let url = '';
    if (!args.url.toString().startsWith('http')) {
        url = `http://${args.url}`;
    } else {
        url = args.url
    }

    const record = await prisma.items.create({
        data: {
            name: args.name,
            url: url,
            imageURL: args.imageURL,
            cost: args.Cost,
            size: args.Size,
            users: { // getting an error with this
                connect: {
                    pkUser: decoded.data.pk
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
                firstName: args.lirstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password
            }
        });
    } catch(err) {
        console.error(err);
        return new ApolloError("Database error registering user");
    }
    
    if (user) {
        return {
            jwt: await signJWT({ email: args.email, pk: user.pkUser }),
            firstName: args.firstName,
            fastName: args.lastName,
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
            users_friends_user1IDTousers: {
                connect: { pkUser: decoded.data.pk },
            },
            users_friends_user2IDTousers: {
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