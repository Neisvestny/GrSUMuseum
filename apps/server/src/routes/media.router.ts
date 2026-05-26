import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller.js';
import { prisma } from '../db/prisma';
import { requireAuth } from '../app/middleware/require-auth.js';
import { ensureRootDirs } from '../lib/media-storage.js';
import { MediaStorageService } from '../services/media-storage.service.js';
import { MediaService } from '../services/media.service.js';

const mediaService = new MediaService(prisma);
const storageService = new MediaStorageService(mediaService);
const controller = new MediaController(mediaService, storageService);

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024,
		files: 20,
	},
});

export const mediaRouter = Router();

void ensureRootDirs();

mediaRouter.get('/gallery/photos', controller.getPhotos);
mediaRouter.get('/gallery/videos', controller.getVideos);

const adminMediaRouter = Router();
adminMediaRouter.use(requireAuth);

adminMediaRouter.get('/roots', controller.getRoots);
adminMediaRouter.get('/browse', controller.browse);
adminMediaRouter.get('/search', controller.search);
adminMediaRouter.patch('/assets/:id', controller.updateAsset);
adminMediaRouter.post('/assets/link', controller.registerLink);
adminMediaRouter.patch('/gallery/photos/reorder', controller.reorderPhotos);
adminMediaRouter.patch('/gallery/videos/reorder', controller.reorderVideos);
adminMediaRouter.post('/mkdir', controller.mkdir);
adminMediaRouter.post('/rename', controller.rename);
adminMediaRouter.post('/move', controller.move);
adminMediaRouter.delete('/item', controller.deleteItem);
adminMediaRouter.post('/upload', upload.array('files'), controller.upload);
adminMediaRouter.post('/upload-url', controller.uploadUrl);

mediaRouter.use(adminMediaRouter);
