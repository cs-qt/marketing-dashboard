import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import calendarRoutes from './calendar.routes.js';
import productionRoutes from './production.routes.js';
import commentsRoutes from './comments.routes.js';
import analyticsRoutes from './analytics.routes.js';
import monthsRoutes from './months.routes.js';
import mediaRoutes from './media.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/calendar', calendarRoutes);
router.use('/production', productionRoutes);
router.use('/comments', commentsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/months', monthsRoutes);
router.use('/media', mediaRoutes);

export default router;
