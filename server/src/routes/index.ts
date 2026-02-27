import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import calendarRoutes from './calendar.routes';
import productionRoutes from './production.routes';
import commentsRoutes from './comments.routes';
import analyticsRoutes from './analytics.routes';
import monthsRoutes from './months.routes';
import mediaRoutes from './media.routes';

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
