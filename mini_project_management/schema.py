import graphene


class Query(graphene.ObjectType):
    hello = graphene.String(default_value="Hello World!")


class Mutation(graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)