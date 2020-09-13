const { verifyUser, signJWT } = require("../modules/jwt");
const { doesUserExist } = require("../modules/helpers");
const { ApolloError, AuthenticationError } = require('apollo-server');
const { JsonWebTokenError } = require("jsonwebtoken");

const login = async (parent, args, { prisma }) => {
    console.log("login: ", args);
    try {
        const exists = await prisma.users.findMany({
            where: {
                email: args.email,
                password: args.password
            }
        });

        if (exists) {
            return {
                jwt: signJWT({ email: args.email, pk: exists[0].pkUser }),
                firstName: exists[0].firstName,
                lastName: exists[0].lastName,
                image_path: exists[0].image_path
            }
        } else {
            return new AuthenticationError('User name and/or password is incorrect');
        }
    }
    catch(err) {
        console.error(err)
        return new ApolloError('Internal error: Login');  
    }
};

const searchUsersForNewFriends = async (parent, args, { prisma, token }) => {
    console.log("searching for friend")
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error with jwt');
    }

    if(!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits')
    }

    try {
        return await prisma.users.findMany({
            where: { 
                email: {
                    contains: args.search
                }
            }
        });
    } catch (err) {
        return new ApolloError("error searching to add new friends", err);
    }
};

const getItems = async (parent, args, { prisma, token }) => {
    console.log("items fetch")
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error with jwt');
    }

    if(!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits')
    }
    
    try {
        return await prisma.items.findMany({
            where: {
                users: {
                    email: {
                        equals: decoded.data.email
                    }
                }
            }
        });
    } catch (err) {
        return new ApolloError("error retrieving items", err);
    }
};

const friends = async (parent, args, { prisma, token }) => {
    console.log("Friends request")
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error with jwt');
    }
    console.log(decoded)
    if(!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }

    try {
        const friends = await prisma
            .queryRaw(
                `select 
                    u2."pkUser", u2."firstName", 
                    u2."lastName", u2.image_path
                from users u1
                inner join friends f
                    on u1."pkUser" in (f."user2ID", f."user1ID")
                inner join users   u2
                    on  u2."pkUser" in (f."user2ID", f."user1ID")
                    and u1."pkUser" <> u2."pkUser"
                where u1."email" = '${decoded.data.email}';`);
        console.log(`Successful fetch`);
        return friends;
    } catch(err) {
        return new ApolloError("error retrieving items", err);
    }
};

module.exports = {
    login,
    searchUsersForNewFriends,
    getItems,
    friends,
}