import express from 'express';

import {
  getAllServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
  getTimeSlots,
  getAvilableSlots,
  createTimeSlot,
  updateTimeSlot,
  deletTimeSlot,

} from '../controllers/serviceController.js';

import { authMiddleware,adminMiddleware } from '../middleware/authMiddleware.js';

const serviceRouter = express.Router();

// Public routes
serviceRouter.get('/active',getActiveServices);
serviceRouter.get('/:service_id/slots/avilable',getAvilableSlots);

// Protected routes (require authentication)
serviceRouter.use(authMiddleware);

// Admin-only services routes
serviceRouter.get('/all',adminMiddleware,getAllServices);
serviceRouter.post('/',adminMiddleware,createService);
serviceRouter.put('/:service_id',adminMiddleware,updateService);
serviceRouter.delete('/:service_id',adminMiddleware,deleteService);

// Time slots routes

serviceRouter.get('/:service_id/slots',getTimeSlots);
serviceRouter.post('/slots',adminMiddleware,createTimeSlot);
serviceRouter.put('/slots/:slot_id/status', adminMiddleware, updateTimeSlot);
serviceRouter.delete('/slots/:slot_id', adminMiddleware, deletTimeSlot);

export default serviceRouter;


