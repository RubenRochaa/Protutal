import { Request, Response } from "express"
import { ListCategoryService } from "../../exemplo_service/category/ListCategoryService"

class ListCategoryController {
    async handle(req: Request, res: Response) {

        const listCategoryService = new ListCategoryService();

        const category = await listCategoryService.execute()

        res.json(category)
    }
}

export { ListCategoryController }