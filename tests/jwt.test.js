const jwt = require('../modules/jwt');


describe("signing JWT", () => {
    test("This should sign a jwt and hold the correct payload", () => {
        const input1 = jwt.signJWT("test1");
        const input2 = jwt.signJWT("test2");
        const input3 = jwt.signJWT("test3");

        expect(jwt.verifyUser(input1).data).toEqual('test1');
        expect(jwt.verifyUser(input2).data).toEqual('test2');
        expect(jwt.verifyUser(input3).data).toEqual('test3');

        expect(jwt.verifyUser(input1).data).not.toEqual('test3');
        expect(jwt.verifyUser(input2).data).not.toEqual('test1');
        expect(jwt.verifyUser(input3).data).not.toEqual('test2');
    });
});