const { verifyUser } = require('../modules/jwt');
const { doesUserExist } = require('../modules/helpers');

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