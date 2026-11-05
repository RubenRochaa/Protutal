import { Request, response, Response } from "express";
import { CreateUserService } from "../../exemplo_service/user/CreateUserService";


class CreateUserController {
    async handle(req: Request, res: Response) {
        const { name, email, password } = req.body;

        const createUserService = new CreateUserService();

        const user = await createUserService.execute({
            name,
            email,
            password
        });

        res.json(user)
    }
}

export { CreateUserController }