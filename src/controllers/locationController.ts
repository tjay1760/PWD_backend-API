import { Request, Response } from 'express';
import { countyData } from '../models/LocationData'; // Import the data from your new file

/**
 * Handles requests to get all county data.
 * @param req Express Request object
 * @param res Express Response object
 */
export const getCounties = (req: Request, res: Response) => {
    try {
        res.status(200).json(countyData);
    } catch (error) {
        console.error("Failed to fetch county data:", error);
        res.status(500).json({ message: "Error retrieving county data." });
    }
};

/**
 * Handles requests to get a single county by ID.
 * @param req Express Request object
 * @param res Express Response object
 */
export const getCountyById = (req: Request, res: Response) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }

    const county = countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county);
    } else {
        res.status(404).json({ message: "County not found." });
    }
};

/**
 * Handles requests to get sub-counties for a specific county.
 * @param req Express Request object
 * @param res Express Response object
 */
export const getSubCountiesByCountyId = (req: Request, res: Response) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }

    const county = countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county.subCounties);
    } else {
        res.status(404).json({ message: "County not found." });
    }
};

/**
 * Handles requests to get hospitals for a specific county.
 * @param req Express Request object
 * @param res Express Response object
 */
export const getHospitalsByCountyId = (req: Request, res: Response) => {
    const countyId = parseInt(req.params.id);
    if (isNaN(countyId)) {
        return res.status(400).json({ message: "Invalid county ID provided." });
    }

    const county = countyData.find(c => c.id === countyId);
    if (county) {
        res.status(200).json(county.hospitals);
    } else {
        res.status(404).json({ message: "County not found." });
    }
};