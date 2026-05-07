import { Router } from 'express';
import { GalleryController } from '../controllers/gallery.controller';
import { prisma } from '../db/prisma';
import { GalleryService } from '../services/gallery.service';

const service = new GalleryService(prisma);
const controller = new GalleryController(service);

export const galleryRouter = Router();

galleryRouter.get('/photos', controller.getPhotos);
galleryRouter.get('/videos', controller.getVideos);

// admin: photos
galleryRouter.post('/photos', controller.createPhoto);
galleryRouter.put('/photos/:id', controller.updatePhoto);
galleryRouter.delete('/photos/:id', controller.deletePhoto);
galleryRouter.patch('/photos/reorder', controller.reorderPhotos);

// admin: videos
galleryRouter.post('/videos', controller.createVideo);
galleryRouter.put('/videos/:id', controller.updateVideo);
galleryRouter.delete('/videos/:id', controller.deleteVideo);
galleryRouter.patch('/videos/reorder', controller.reorderVideos);
