const { verifyUser, signJWT } = require("../modules/jwt");
const { doesUserExists } = require("../modules/helpers");
const { ApolloError, AuthenticationError } = require('apollo-server');

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
                jwt: signJWT(args.Email),
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

const items = async (parent, args, { prisma }) => {
    const decoded = verifyUser(args.token);
    if (!decoded) {
        return new AuthenticationError('User does not exist');
    }

    if(!doesUserExists(prisma, args.Email)) {
        return 
    }
    
    try {
        return await prisma.items.findMany({
            where: {
                users: {
                    Email: {
                        equals: decoded.data
                    }
                }
            }
        });
    } catch (err) {
        return new ApolloError("error retrieving items", err);
    }
};

const friends = async (parent, args, { prisma }) => {
    const decoded = verifyUser(args.token);
    if (!decoded) {
        return new AuthenticationError('User does not exist');
    }

    try {
        return await prisma
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
                where u1."Email" = '${decoded.data}';`);
    } catch(err) {
        return new ApolloError("error retrieving items", err);
    }
};

module.exports = {
    login,
    users,
    items,
    friends
}