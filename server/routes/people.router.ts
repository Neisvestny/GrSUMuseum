import { Router } from 'express';
import { PeopleController } from '../controllers/people.controller';
import { prisma } from '../db/prisma';
import { PeopleService } from '../services/people.service.js';

const service = new PeopleService(prisma);
const controller = new PeopleController(service);

export const peopleRouter = Router();

// TODO: auth middleware для мутаций

peopleRouter.get('/taxonomy', controller.getTaxonomy);
peopleRouter.post('/taxonomy/roles', controller.createRole);
peopleRouter.put('/taxonomy/roles/:id', controller.updateRole);
peopleRouter.delete('/taxonomy/roles/:id', controller.deleteRole);
peopleRouter.post('/taxonomy/tags', controller.createTag);
peopleRouter.put('/taxonomy/tags/:id', controller.updateTag);
peopleRouter.delete('/taxonomy/tags/:id', controller.deleteTag);
peopleRouter.post('/taxonomy/categories', controller.createCategory);
peopleRouter.put('/taxonomy/categories/:id', controller.updateCategory);
peopleRouter.delete('/taxonomy/categories/:id', controller.deleteCategory);

peopleRouter.get('/', controller.list);
peopleRouter.patch('/reorder', controller.reorder);
peopleRouter.get('/:id', controller.getById);
peopleRouter.post('/', controller.create);
peopleRouter.put('/:id', controller.update);
peopleRouter.delete('/:id', controller.delete);
