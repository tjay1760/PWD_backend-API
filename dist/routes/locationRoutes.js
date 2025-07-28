"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController_1 = require("../controllers/locationController");
const router = (0, express_1.Router)();
// GET all counties
router.get('/', locationController_1.getCounties);
// GET a single county by ID
router.get('/:id', locationController_1.getCountyById);
// GET sub-counties for a specific county ID
router.get('/:id/subcounties', locationController_1.getSubCountiesByCountyId);
// GET hospitals for a specific county ID
router.get('/:id/hospitals', locationController_1.getHospitalsByCountyId);
exports.default = router;
