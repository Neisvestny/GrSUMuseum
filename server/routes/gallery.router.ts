import { Router } from 'express';
import { GalleryController } from '../controllers/gallery.controller';
import { prisma } from '../db/prisma';
import { GalleryService } from '../services/gallery.service';

const service = new GalleryService(prisma);
const controller = new GalleryController(service);

export const galleryRouter = Router();

galleryRouter.get('/photos', controller.getPhotos);
galleryRouter.get('/videos', controller.getVideos);
