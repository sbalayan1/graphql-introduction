const express = require('express') //gets express
const { graphqlHTTP }  = require('express-graphql') //imports express graphql
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLBoolean,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull, //can never return anull for this type. an integer will always be supplied
    GraphQLScalarType
} = require('graphql') //imports our schema and object type. theobject type lets you create an object, full of other diff types

//make shift database of authors and books
const authors = [
    {id: 1, name: 'JkRowling'},
    {id: 2, name: 'jrr tolkien'},
    {id: 3, name: 'brent weeks'}
]

const books = [
    {id: 1, name: 'harry potter', authorId: 1},
    {id: 2, name: 'the fellowship of the ring', authorId: 2},
    {id: 3, name: 'the way of shadows', authorId: 3}
]

//create droot query scope => is the root query that everything is going to pull down from
    //right now our root query is this single hello world object. From this object, we can only query the message field. we want to be able to query more from this root query object.

// const schema = new GraphQLSchema({
//     query: new GraphQLObjectType({ //first the define the query parameter. This is essentially the getting of data
//         name: 'HelloWorld',
//         fields: () => ({
//             message: { //defines the type of our message. this tells us that our helloworld object has a message field. that message field's type is a string
//                 type: GraphQLString, 
//                 resolve: (parent, args) => 1+1 //tells graphql where to get this message field from
//             },
//             string: {
//                 type: GraphQLBoolean,
//                 resolve: () => true
//             } 
            
//         }) //returns the different fields we want to return
//     }),
  
// }) //creates a new schema


//the below defines the booktype
const BookType = new GraphQLObjectType({
    name: 'Book',
    description: ' Book written by an author',
    fields: () => ({ //note we don't need a resolve here because since there's already a property in our object, graphql will pull that property directly from that obj.
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        authorId: {type: GraphQLNonNull(GraphQLInt)},
        author: { //create this new field to display a relationship. here we are trying to display the book's author. The author comes from another obj or table.
            type: AuthorType,
            //note since books doesn't have an author field, we need to specify and custom resolve. this contrasts how we don't need resolves for the above fields like id, name, and author id
            resolve: (book) => {
                //return authors.find(author => author.id == book.authorId) //note this won't work because we don't have the book that's getting queried

                //resolve takes a parent parameter which we call book. In this case, the book that is being queried is passed in as an argument to this resolve. 

                //**this resolve basically tells the BookType, how to get the authors from the specific book*
                return authors.find(author => author.id === book.authorId)
            }
        }
    })
})

//the below defines the authortype
const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'This represents an author of a book',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        name: {type: GraphQLNonNull(GraphQLString)},
        books: {
            //creates a field that represents all of the books for each author
            type: new GraphQLList(BookType), //we need to create a graphql list here because we are returning a list
            resolve: (author) => books.filter(book => book.authorId === author.id) //note this results in a single query to get all of the information. In a normal API, we'd need to make several queries for each author and we'd receive information we don't even really want
        }
    })
})

const rootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        book: {
            type: BookType,
            description: 'a single book',
            args: {
                id: {type: GraphQLInt}
            }, //defines which arguments are valid for our query
            resolve: (parent, args) => books.find(book => book.id == args.id) //return a single book based on the argument passed in. these arguments are passed in from graphiql
        },

        books: {
            type: new GraphQLList(BookType), //booktype is a custom object type that we create
            description: 'List of Books',
            resolve: () => books
        },

        author: {
            type: AuthorType,
            description: 'A Single Author',
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => authors.find(author => author.id == args.id)
        },

        authors: {
            type: new GraphQLList(AuthorType),
            description: 'List of authors',
            resolve: () => authors
        }
    })
})

//create root mutation type
const rootMutationType = new GraphQLObjectType({
    name: 'Mutation', 
    description: 'Root Mutation',
    //the fields property will contain all of the different operations we will do for the different mutations
    fields: () => ({
        addBook: {
            type: BookType, //adding a book returns a booktype
            description: 'adds book',
            args: { //need args because we need data to pass to our server to add a book.
                name: {type: GraphQLNonNull(GraphQLString)},
                authorId: {type: GraphQLNonNull(GraphQLInt)}
            },
            resolve: (parent, args) => {
                const book = { //create a book obj
                    id: books.length + 1, //in a true server we wouldn't need to worry about the id.
                    name: args.name, 
                    authorId: args.id
                }

                books.push(book) //push the book into our books array
                return book //since the addbook returns a booktype, we can return the book
            }
        },

        addAuthor: {
            type: AuthorType,
            description: 'adds author',
            args: {
                name: {type: GraphQLNonNull(GraphQLString)}
            },
            resolve: (parent, args) => {
                const author = {
                    id: authors.length + 1,
                    name: args.name
                }
                authors.push(author)

                return author
            } 
        }
    })
})


//now that we have our book type and our rootquerytype which uses the book type, now i need to create my schema

const schema = new GraphQLSchema({
    query: rootQueryType, 
    mutation: rootMutationType
})

//the schema defines our query section. The query section defines all the diff use cases we can use for querying.

//the fields are all the diff sections of an object that we can query and return data from 
    //fields returns a function instead of an object. If we didn't return a function, the books field in AuthorType and author field in BookType would break because they reference and are therefore dependent on eachother. A BookType cannot exist without an AuthorType and vice versa. A function solves this problem because it allows both the Author and Book Types to be defined before they are called. 


//resolve is what we actually return from this field. note resolve has other args like (parent, args). 
    //-> parent represents the parent that the resolve obj is being called from and args are the different arguments passed to your querry

//mutations => modifying our data. they are graphqls versions of post, patch, and delete
    // example mutation
        // mutation {
        //     addBook(name: "arthur the last samurai", authorId: 1) {
        //          name
        //          authorId
        //  }
        // }


const app = express() //gets the app part of express
app.use('/graphql', graphqlHTTP({ //adds a route for our application
    schema: schema,
    graphiql: true //passing true gives us a UI to access our graphql server without ahving to call it manually through something like postman
})) 


app.listen(5000., () => console.log('server running')) //sets our server to 5000 and runs the function



