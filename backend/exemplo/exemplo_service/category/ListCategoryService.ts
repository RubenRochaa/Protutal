import prismaClient from "../../../src/prisma";

class ListCategoryService{
    async execute(){

        const category = await prismaClient.category.findMany({
            select: {
                id: true,
                name: true,
            }
        })

        return category;
    }
}

export { ListCategoryService }