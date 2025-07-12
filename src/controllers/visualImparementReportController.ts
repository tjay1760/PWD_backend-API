import { Request, Response } from 'express';
import { VisualImpairmentAssessment, IVisualImpairmentAssessment } from '../models/VisualImparementReport';

// Create a new Visual Impairment Assessment
export const createVisualImpairmentAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessmentData: IVisualImpairmentAssessment = req.body; // Type assertion for incoming data
    const newAssessment = new VisualImpairmentAssessment(assessmentData);
    const savedAssessment = await newAssessment.save();
    res.status(201).json(savedAssessment);
  } catch (error: any) {
    console.error('Error creating visual impairment assessment:', error);
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      res.status(400).json({ message: 'Validation Error', details: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create visual impairment assessment', error: error.message });
    }
  }
};

// Get all Visual Impairment Assessments
export const getAllVisualImpairmentAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessments = await VisualImpairmentAssessment.find();
    res.status(200).json(assessments);
  } catch (error: any) {
    console.error('Error fetching visual impairment assessments:', error);
    res.status(500).json({ message: 'Failed to retrieve visual impairment assessments', error: error.message });
  }
};

// Get a single Visual Impairment Assessment by ID
export const getVisualImpairmentAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await VisualImpairmentAssessment.findById(id);
    if (!assessment) {
      res.status(404).json({ message: 'Visual impairment assessment not found' });
      return;
    }
    res.status(200).json(assessment);
  } catch (error: any) {
    console.error('Error fetching visual impairment assessment by ID:', error);
    res.status(500).json({ message: 'Failed to retrieve visual impairment assessment', error: error.message });
  }
};