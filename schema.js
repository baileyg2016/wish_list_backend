const { gql } = require('apollo-server');

const typeDefs = gql`
type Query {
    login(Email: String!, Password: String!): LoginReturned!
    users: [User!]!
    items(token: String!): [Item!]!
    friends(token: String!): [User!]!
    doesUserExist(token: String!): Boolean!
}

type Mutation {
    register(FirstName: String!, LastName: String!, Email: String!, Password: String!): LoginReturned!
    addItem(Name: String!, url: String!, ImageURL: String, Cost: Int, Size: String): ID!
    deleteItem(Token: String!, ItemId: Int!): Boolean!
}

type User {
    id: ID!
    FirstName: String!
    LastName: String!
    Email: String!
    Password: String!
    image_path: String
    token: String
}

type Item {
    id: ID!
    Name: String!
    url: String!
    ImageURL: String
    Cost: Int
    Size: String
    UserID: ID!
}

type Friend {
    id: ID!
    User1ID: Int!
    User2ID: Int!
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