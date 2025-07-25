import { Router } from 'express';
import { getCounties, getCountyById, getSubCountiesByCountyId, getHospitalsByCountyId } from '../controllers/locationController';

const router = Router();

// GET all counties
router.get('/', getCounties);
// GET a single county by ID
router.get('/:id', getCountyById);
// GET sub-counties for a specific county ID
router.get('/:id/subcounties', getSubCountiesByCountyId);
// GET hospitals for a specific county ID
router.get('/:id/hospitals', getHospitalsByCountyId);

export default router;