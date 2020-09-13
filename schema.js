const { gql } = require('apollo-server');

const typeDefs = gql`
type Query {
    login(email: String!, password: String!): LoginReturned!
    searchUsersForNewFriends(search: String!): [User!]!
    getItems: [Item!]!
    friends: [User!]!
    doesUserExist(token: String!): Boolean!
}

type Mutation {
    register(firstName: String!, lastName: String!, email: String!, password: String!): LoginReturned!
    addItem(name: String!, url: String!, imageURL: String, cost: Int, size: String): Int!
    deleteItem(pkItem: Int!): Boolean!
    addFriend(pkFriend: Int!): Int!
    unFriend(pkFriend: Int!): Boolean!
}

type User {
    pkUser: Int!
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    image_path: String
    token: String
}

type Item {
    pkItem: Int!
    name: String!
    url: String!
    imageURL: String
    cost: Int
    size: String
    userID: ID!
}

type Friend {
    pkFriend: Int!
    user1ID: Int!
    user2ID: Int!
}

type LoginReturned {
    jwt: String!
    firstName: String
    lastName: String
    image_path: String
}

type RegisterReturned {
    jwt: String!
    firstName: String
    lastName: String
}
`;

module.exports = typeDefs;