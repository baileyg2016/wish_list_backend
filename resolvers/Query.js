const { verifyUser, signJWT } = require("../modules/jwt");

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
        }
    }
    catch(err) {
        console.error(err)
        return "500 Internal server error"  
    }
};

const users = async (parent, args, { prisma }) => {
    return await prisma.users.findMany();
};

const items = async (parent, args, { prisma }) => {
    const decoded = verifyUser(args.token);
    return await prisma.items.findMany({
        where: {
            users: {
                Email: {
                    equals: decoded.data
                }
            }
        }
    });
};

const friends = async (parent, args, { prisma }) => {
    const decoded = verifyUser(args.token);
    return await prisma.queryRaw(`select u2."pkUser", u2."FirstName", u2."LastName", u2.image_path
                                    from users u1
                                    inner join friends f
                                        on u1."pkUser" in (f."User2ID", f."User1ID")
                                    inner join users   u2
                                        on  u2."pkUser" in (f."User2ID", f."User1ID")
                                        and u1."pkUser" <> u2."pkUser"
                                    where u1."Email" = '${decoded.data}';`);
};

module.exports = {
    login,
    users,
    items,
    friends
}