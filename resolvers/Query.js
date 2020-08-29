const { verifyUser, signJWT } = require("../modules/jwt");
const { doesUserExist } = require("../modules/helpers");
const { ApolloError, AuthenticationError } = require('apollo-server');
const { JsonWebTokenError } = require("jsonwebtoken");

const login = async (parent, args, { prisma }) => {
    try {
        const exists = await prisma.users.findMany({
            where: {
                Email: args.Email,
                Password: args.Password
            }
        });

        if (exists) {
            return {
                jwt: signJWT({ email: args.Email, pk: exists[0].pkUser }),
                firstName: exists[0].FirstName,
                lastName: exists[0].LastName,
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

const users = async (parent, args, { prisma }) => {
    return await prisma.users.findMany();
};

const getItems = async (parent, args, { prisma, token }) => {
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
                    Email: {
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
    const decoded = verifyUser(token);
    if (!decoded) {
        return new JsonWebTokenError('Error with jwt');
    }

    if(!doesUserExist(prisma, decoded.data.email)) {
        return new AuthenticationError('User does not exits');
    }

    try {
        const friends = await prisma
            .queryRaw(
                `select 
                    u2."pkUser", u2."FirstName", 
                    u2."LastName", u2.image_path
                from users u1
                inner join friends f
                    on u1."pkUser" in (f."User2ID", f."User1ID")
                inner join users   u2
                    on  u2."pkUser" in (f."User2ID", f."User1ID")
                    and u1."pkUser" <> u2."pkUser"
                where u1."Email" = '${decoded.data.email}';`);

        return friends;
    } catch(err) {
        return new ApolloError("error retrieving items", err);
    }
};

module.exports = {
    login,
    users,
    getItems,
    friends
}