"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHospitalsByCountyId = exports.getSubCountiesByCountyId = exports.getCountyById = exports.getCounties = void 0;
const LocationData_1 = require("../models/LocationData"); // Import the data from your new file
/**
 * Handles requests to get all county data.
 * @param req Express Request object
 * @param res Express Response object
 */
const getCounties = (req, res) => {
    try {
        res.status(200).json(LocationData_1.countyData);
    }
    catch (error) {
        console.error("Failed to fetch county data:", error);
        res.status(500).json({ message: "Error retrieving county data." });
    }
};
exports.getCounties = getCounties;
/**
 * Handles requests to get a single county by ID.
 * @param req Express Request object
 * @param res Express Response object
 */
const getCountyById = (req, res) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }
    const county = LocationData_1.countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county);
    }
    else {
        res.status(404).json({ message: "County not found." });
    }
};
exports.getCountyById = getCountyById;
/**
 * Handles requests to get sub-counties for a specific county.
 * @param req Express Request object
 * @param res Express Response object
 */
const getSubCountiesByCountyId = (req, res) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }
    const county = LocationData_1.countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county.subCounties);
    }
    else {
        res.status(404).json({ message: "County not found." });
    }
};
exports.getSubCountiesByCountyId = getSubCountiesByCountyId;
/**
 * Handles requests to get hospitals for a specific county.
 * @param req Express Request object
 * @param res Express Response object
 */
const getHospitalsByCountyId = (req, res) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }
    const county = LocationData_1.countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county.hospitals);
    }
    else {
        res.status(404).json({ message: "County not found." });
    }
};
exports.getHospitalsByCountyId = getHospitalsByCountyId;
