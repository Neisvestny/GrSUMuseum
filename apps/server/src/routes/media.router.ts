import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller.js';
import { prisma } from '../db/prisma';
import { ensureRootDirs } from '../lib/media-storage.js';
import { MediaStorageService } from '../services/media-storage.service.js';
import { MediaService } from '../services/media.service.js';

const mediaService = new MediaService(prisma);
const storageService = new MediaStorageService(mediaService);
const controller = new MediaController(mediaService, storageService);

const upload = multer({ storage: multer.memoryStorage() });

export const mediaRouter = Router();

void ensureRootDirs();

mediaRouter.get('/roots', controller.getRoots);
mediaRouter.get('/browse', controller.browse);
mediaRouter.get('/search', controller.search);
mediaRouter.patch('/assets/:id', controller.updateAsset);
mediaRouter.post('/assets/link', controller.registerLink);

mediaRouter.get('/gallery/photos', controller.getPhotos);
mediaRouter.get('/gallery/videos', controller.getVideos);
mediaRouter.patch('/gallery/photos/reorder', controller.reorderPhotos);
mediaRouter.patch('/gallery/videos/reorder', controller.reorderVideos);

mediaRouter.post('/mkdir', controller.mkdir);
mediaRouter.post('/rename', controller.rename);
mediaRouter.post('/move', controller.move);
mediaRouter.delete('/item', controller.deleteItem);
mediaRouter.post('/upload', upload.array('files'), controller.upload);
mediaRouter.post('/upload-url', controller.uploadUrl);
