const { gql } = require('apollo-server');

const typeDefs = gql`
type Query {
    users: [User!]!
}

type User {
    id: ID!
    FirstName: String!
    FastName: String!
    Email: String!
    Password: String!
    image_path: String!
}
`;

module.exports = typeDefs;