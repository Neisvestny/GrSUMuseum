import { Router } from 'express';
import { PeopleController } from '../controllers/people.controller';
import { prisma } from '../db/prisma';
import { requireAuth } from '../app/middleware/require-auth.js';
import { PeopleService } from '../services/people.service.js';

const service = new PeopleService(prisma);
const controller = new PeopleController(service);

export const peopleRouter = Router();

peopleRouter.get('/', controller.list);

const adminPeopleRouter = Router();
adminPeopleRouter.use(requireAuth);

adminPeopleRouter.get('/taxonomy', controller.getTaxonomy);
adminPeopleRouter.post('/taxonomy/roles', controller.createRole);
adminPeopleRouter.put('/taxonomy/roles/:id', controller.updateRole);
adminPeopleRouter.delete('/taxonomy/roles/:id', controller.deleteRole);
adminPeopleRouter.post('/taxonomy/tags', controller.createTag);
adminPeopleRouter.put('/taxonomy/tags/:id', controller.updateTag);
adminPeopleRouter.delete('/taxonomy/tags/:id', controller.deleteTag);
adminPeopleRouter.post('/taxonomy/categories', controller.createCategory);
adminPeopleRouter.put('/taxonomy/categories/:id', controller.updateCategory);
adminPeopleRouter.delete('/taxonomy/categories/:id', controller.deleteCategory);

adminPeopleRouter.patch('/reorder', controller.reorder);
adminPeopleRouter.post('/', controller.create);
adminPeopleRouter.put('/:id', controller.update);
adminPeopleRouter.delete('/:id', controller.delete);

peopleRouter.use(adminPeopleRouter);
peopleRouter.get('/:id', controller.getById);
